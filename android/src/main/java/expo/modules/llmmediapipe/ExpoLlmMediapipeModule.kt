package expo.modules.llmmediapipe

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class ExpoLlmMediapipeModule : Module() {
  private var nextHandle = 1
  private val modelMap = mutableMapOf<Int, LlmInferenceModel>()

  // Define these functions at class level, not in the definition block
  private fun createInferenceListener(modelHandle: Int): InferenceListener {
    return object : InferenceListener {
      override fun logging(model: LlmInferenceModel, message: String) {
        sendEvent("logging", mapOf(
          "handle" to modelHandle,
          "message" to message
        ))
      }
      
      override fun onError(model: LlmInferenceModel, requestId: Int, error: String) {
        sendEvent("onErrorResponse", mapOf(
          "handle" to modelHandle,
          "requestId" to requestId,
          "error" to error
        ))
      }
      
      override fun onResults(model: LlmInferenceModel, requestId: Int, response: String) {
        sendEvent("onPartialResponse", mapOf(
          "handle" to modelHandle,
          "requestId" to requestId,
          "response" to response
        ))
      }
    }
  }
  
  private fun copyFileToInternalStorageIfNeeded(modelName: String, context: Context): File {
    val outputFile = File(context.filesDir, modelName)

    // Check if the file already exists
    if (outputFile.exists()) {
      // The file already exists, no need to copy again
      sendEvent("logging", mapOf(
        "message" to "File already exists: ${outputFile.path}, size: ${outputFile.length()}"
      ))
      return outputFile
    }

    try {
      val assetList = context.assets.list("") ?: arrayOf()
      sendEvent("logging", mapOf(
        "message" to "Available assets: ${assetList.joinToString()}"
      ))
      
      if (!assetList.contains(modelName)) {
        val errorMsg = "Asset file $modelName does not exist in assets"
        sendEvent("logging", mapOf("message" to errorMsg))
        throw IllegalArgumentException(errorMsg)
      }

      sendEvent("logging", mapOf(
        "message" to "Copying asset $modelName to ${outputFile.path}"
      ))
      
      // File doesn't exist, proceed with copying
      context.assets.open(modelName).use { inputStream ->
        FileOutputStream(outputFile).use { outputStream -> 
          val buffer = ByteArray(1024)
          var read: Int
          var total = 0
          
          while (inputStream.read(buffer).also { read = it } != -1) {
            outputStream.write(buffer, 0, read)
            total += read
            
            if (total % (1024 * 1024) == 0) { // Log every MB
              sendEvent("logging", mapOf(
                "message" to "Copied $total bytes so far"
              ))
            }
          }
          
          sendEvent("logging", mapOf(
            "message" to "Copied $total bytes total"
          ))
        }
      }
    } catch (e: Exception) {
      sendEvent("logging", mapOf(
        "message" to "Error copying file: ${e.message}"
      ))
      throw e
    }

    return outputFile
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoLlmMediapipe")

    Constants(
      "PI" to Math.PI
    )

    Events("onChange", "onPartialResponse", "onErrorResponse", "logging")

    Function("hello") {
      "Hello world from MediaPipe LLM! 👋"
    }

    AsyncFunction("createModel") { modelPath: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise ->
      try {
        val modelHandle = nextHandle++
        
        // Log that we're creating a model
        sendEvent("logging", mapOf(
          "handle" to modelHandle,
          "message" to "Creating model from path: $modelPath"
        ))
        
        val model = LlmInferenceModel(
          appContext.reactContext!!,
          modelPath,
          maxTokens,
          topK,
          temperature.toFloat(),
          randomSeed,
          inferenceListener = createInferenceListener(modelHandle)
        )
        modelMap[modelHandle] = model
        promise.resolve(modelHandle)
      } catch (e: Exception) {
        // Log the error
        sendEvent("logging", mapOf(
          "message" to "Model creation failed: ${e.message}"
        ))
        promise.reject("MODEL_CREATION_FAILED", e.message ?: "Unknown error", e)
      }
    }

    AsyncFunction("createModelFromAsset") { modelName: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise ->
      try {
        // Log that we're creating a model from asset
        sendEvent("logging", mapOf(
          "message" to "Creating model from asset: $modelName"
        ))
        
        val modelPath = copyFileToInternalStorageIfNeeded(modelName, appContext.reactContext!!).path
        
        sendEvent("logging", mapOf(
          "message" to "Model file copied to: $modelPath"
        ))
        
        val modelHandle = nextHandle++
        val model = LlmInferenceModel(
          appContext.reactContext!!,
          modelPath,
          maxTokens,
          topK,
          temperature.toFloat(),
          randomSeed,
          inferenceListener = createInferenceListener(modelHandle)
        )
        modelMap[modelHandle] = model
        promise.resolve(modelHandle)
      } catch (e: Exception) {
        // Log the error
        sendEvent("logging", mapOf(
          "message" to "Model creation from asset failed: ${e.message}"
        ))
        promise.reject("MODEL_CREATION_FAILED", e.message ?: "Unknown error", e)
      }
    }

    AsyncFunction("releaseModel") { handle: Int, promise: Promise ->
      try {
        val removed = modelMap.remove(handle) != null
        if (removed) {
          promise.resolve(true)
        } else {
          promise.reject("INVALID_HANDLE", "No model found for handle $handle", null)
        }
      } catch (e: Exception) {
        promise.reject("RELEASE_FAILED", e.message ?: "Unknown error", e)
      }
    }

    AsyncFunction("generateResponse") { handle: Int, requestId: Int, prompt: String, promise: Promise ->
      try {
        val model = modelMap[handle]
        if (model == null) {
          promise.reject("INVALID_HANDLE", "No model found for handle $handle", null)
          return@AsyncFunction
        }
        
        sendEvent("logging", mapOf(
          "handle" to handle,
          "message" to "Generating response with prompt: ${prompt.take(30)}..."
        ))
        
        // Use the synchronous version
        val response = model.generateResponse(requestId, prompt)
        promise.resolve(response)
      } catch (e: Exception) {
        sendEvent("logging", mapOf(
          "handle" to handle,
          "message" to "Generation error: ${e.message}"
        ))
        promise.reject("GENERATION_FAILED", e.message ?: "Unknown error", e)
      }
    }

    AsyncFunction("generateResponseAsync") { handle: Int, requestId: Int, prompt: String, promise: Promise ->
      try {
        val model = modelMap[handle]
        if (model == null) {
          promise.reject("INVALID_HANDLE", "No model found for handle $handle", null)
          return@AsyncFunction
        }
        
        sendEvent("logging", mapOf(
          "handle" to handle,
          "requestId" to requestId,
          "message" to "Starting async generation with prompt: ${prompt.take(30)}..."
        ))
        
        // Use the async version with callback and event emission
        try {
          model.generateResponseAsync(requestId, prompt) { result ->
            try {
              if (result.isEmpty()) {
                sendEvent("logging", mapOf(
                  "handle" to handle,
                  "requestId" to requestId,
                  "message" to "Generation completed but returned empty result"
                ))
                promise.reject("GENERATION_FAILED", "Failed to generate response", null)
              } else {
                sendEvent("logging", mapOf(
                  "handle" to handle,
                  "requestId" to requestId,
                  "message" to "Generation completed successfully with ${result.length} characters"
                ))
                
                // We don't resolve with the final result here anymore
                // The client will assemble the full response from streaming events
                promise.resolve(true)  // Just send success signal
              }
            } catch (e: Exception) {
              sendEvent("logging", mapOf(
                "handle" to handle,
                "requestId" to requestId,
                "message" to "Error in async result callback: ${e.message}"
              ))
              // Only reject if not already settled
              promise.reject("GENERATION_ERROR", e.message ?: "Unknown error", e)
            }
          }
        } catch (e: Exception) {
          sendEvent("logging", mapOf(
            "handle" to handle,
            "requestId" to requestId,
            "message" to "Exception during generateResponseAsync call: ${e.message}"
          ))
          promise.reject("GENERATION_ERROR", e.message ?: "Unknown error", e)
        }
      } catch (e: Exception) {
        sendEvent("logging", mapOf(
          "handle" to handle,
          "message" to "Outer exception in generateResponseAsync: ${e.message}"
        ))
        promise.reject("GENERATION_ERROR", e.message ?: "Unknown error", e)
      }
    }
  }
}
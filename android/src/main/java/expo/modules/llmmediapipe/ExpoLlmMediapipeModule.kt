package expo.modules.llmmediapipe

import android.content.Context
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.BufferedInputStream

private const val TAG = "ExpoLlmMediapipe"
private const val DOWNLOAD_DIRECTORY = "llm_models"

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

  // Model directory management
  private fun getModelDirectory(): File {
    val modelDir = File(appContext.reactContext!!.filesDir, DOWNLOAD_DIRECTORY)
    if (!modelDir.exists()) {
      modelDir.mkdirs()
    }
    return modelDir
  }
  
  private fun getModelFile(modelName: String): File {
    return File(getModelDirectory(), modelName)
  }
  
  // Create model internal helper method
  private fun createModelInternal(modelPath: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int): Int {
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
    return modelHandle
  }

  // Track active downloads
  private val activeDownloads = mutableMapOf<String, Job>()

  override fun definition() = ModuleDefinition {
    Name("ExpoLlmMediapipe")

    Constants(
      "PI" to Math.PI
    )

    Events("onChange", "onPartialResponse", "onErrorResponse", "logging", "downloadProgress")

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

    // Check if model is downloaded
    AsyncFunction("isModelDownloaded") { modelName: String, promise: Promise ->
      val modelFile = getModelFile(modelName)
      promise.resolve(modelFile.exists() && modelFile.length() > 0)
    }
    
    // Get list of downloaded models
    AsyncFunction("getDownloadedModels") { promise: Promise ->
      val models = getModelDirectory().listFiles()?.map { it.name } ?: emptyList()
      promise.resolve(models)
    }
    
    // Delete downloaded model
    AsyncFunction("deleteDownloadedModel") { modelName: String, promise: Promise ->
      val modelFile = getModelFile(modelName)
      val result = if (modelFile.exists()) modelFile.delete() else false
      promise.resolve(result)
    }
    
    // Download model from URL
    AsyncFunction("downloadModel") { url: String, modelName: String, options: Map<String, Any>?, promise: Promise ->
      val modelFile = getModelFile(modelName)
      val overwrite = (options?.get("overwrite") as? Boolean) ?: false
      
      // Check if already downloading
      if (activeDownloads.containsKey(modelName)) {
        promise.reject("ERR_ALREADY_DOWNLOADING", "This model is already being downloaded", null)
        return@AsyncFunction
      }
      
      // Check if already exists
      if (modelFile.exists() && !overwrite) {
        promise.resolve(true)
        return@AsyncFunction
      }
      
      // Start download in coroutine
      val downloadJob = CoroutineScope(Dispatchers.IO).launch {
        try {
          val connection = URL(url).openConnection() as HttpURLConnection
          
          // Add custom headers if provided
          (options?.get("headers") as? Map<String, Any>)?.let { headers ->
            headers.forEach { (key, value) ->
              connection.setRequestProperty(key, value.toString())
            }
          }
          
          connection.connectTimeout = (options?.get("timeout") as? Number)?.toInt() ?: 30000
          connection.connect()
          
          val contentLength = connection.contentLength.toLong()
          val input = BufferedInputStream(connection.inputStream)
          val tempFile = File(modelFile.absolutePath + ".temp")
          val output = FileOutputStream(tempFile)
          
          val buffer = ByteArray(8192)
          var total: Long = 0
          var count: Int
          var lastUpdateTime = System.currentTimeMillis()
          
          while (input.read(buffer).also { count = it } != -1) {
            if (isActive.not()) {
              // Download was cancelled
              output.close()
              input.close()
              tempFile.delete()
              sendEvent("downloadProgress", mapOf(
                "modelName" to modelName,
                "url" to url,
                "status" to "cancelled"
              ))
              return@launch
            }
            
            total += count
            output.write(buffer, 0, count)
            
            // Send progress updates, throttled to avoid too many events
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastUpdateTime > 100) { // Every 100ms
              lastUpdateTime = currentTime
              val progress = if (contentLength > 0) total.toDouble() / contentLength.toDouble() else 0.0
              sendEvent("downloadProgress", mapOf(
                "modelName" to modelName,
                "url" to url,
                "bytesDownloaded" to total,
                "totalBytes" to contentLength,
                "progress" to progress,
                "status" to "downloading"
              ))
            }
          }
          
          // Close streams
          output.flush()
          output.close()
          input.close()
          
          // Rename temp file to final file
          if (modelFile.exists()) {
            modelFile.delete()
          }
          tempFile.renameTo(modelFile)
          
          // Notify completion
          sendEvent("downloadProgress", mapOf(
            "modelName" to modelName,
            "url" to url,
            "bytesDownloaded" to modelFile.length(),
            "totalBytes" to modelFile.length(),
            "progress" to 1.0,
            "status" to "completed"
          ))
          
          withContext(Dispatchers.Main) {
            promise.resolve(true)
          }
        } catch (e: Exception) {
          Log.e(TAG, "Error downloading model: ${e.message}", e)
          sendEvent("downloadProgress", mapOf(
            "modelName" to modelName,
            "url" to url,
            "status" to "error",
            "error" to (e.message ?: "Unknown error")
          ))
          withContext(Dispatchers.Main) {
            promise.reject("ERR_DOWNLOAD", "Failed to download model: ${e.message}", e)
          }
        } finally {
          activeDownloads.remove(modelName)
        }
      }
      
      activeDownloads[modelName] = downloadJob
    }
    
    // Cancel download
    AsyncFunction("cancelDownload") { modelName: String, promise: Promise ->
      val job = activeDownloads[modelName]
      if (job != null) {
        job.cancel()
        activeDownloads.remove(modelName)
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    }
    
    // Create model from downloaded file
    AsyncFunction("createModelFromDownloaded") { modelName: String, maxTokens: Int?, topK: Int?, temperature: Double?, randomSeed: Int?, promise: Promise ->
      val modelFile = getModelFile(modelName)
      
      if (!modelFile.exists()) {
        promise.reject("ERR_MODEL_NOT_FOUND", "Model $modelName is not downloaded", null)
        return@AsyncFunction
      }
      
      try {
        val handle = createModelInternal(
          modelFile.absolutePath,
          maxTokens ?: 1024,
          topK ?: 40,
          temperature ?: 0.7,
          randomSeed ?: 42
        )
        // Explicitly cast to avoid ambiguity
        promise.resolve(handle as Int)
      } catch (e: Exception) {
        Log.e(TAG, "Error creating model from downloaded file: ${e.message}", e)
        promise.reject("ERR_CREATE_MODEL", "Failed to create model: ${e.message}", e)
      }
    }
  }
}
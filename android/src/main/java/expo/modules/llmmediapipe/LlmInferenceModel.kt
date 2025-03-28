package expo.modules.llmmediapipe

import android.content.Context
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import com.google.mediapipe.tasks.genai.llminference.ProgressListener
import java.io.File

class LlmInferenceModel(
    private var context: Context,
    private val modelPath: String,
    val maxTokens: Int,
    val topK: Int,
    val temperature: Float,
    val randomSeed: Int,
    val inferenceListener: InferenceListener? = null,
) {
    private var llmInference: LlmInference
    private var llmInferenceSession: LlmInferenceSession

    // For tracking current request
    private var requestId: Int = 0
    private var requestResult: String = ""
    
    init {
        // Create the LLM engine
        val inferenceOptions = LlmInference.LlmInferenceOptions.builder()
            .setModelPath(modelPath)
            .setMaxTokens(maxTokens)
            .setPreferredBackend(LlmInference.Backend.CPU)
            .build()

        try {
            llmInference = LlmInference.createFromOptions(context, inferenceOptions)
            inferenceListener?.logging(this, "LLM inference engine created successfully")
        } catch (e: Exception) {
            inferenceListener?.logging(this, "Error creating LLM inference engine: ${e.message}")
            throw e
        }

        // Create a session with the specified parameters
        val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
            .setTemperature(temperature)
            .setTopK(topK)
            .build()

        try {
            llmInferenceSession = LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
            inferenceListener?.logging(this, "LLM inference session created successfully")
        } catch (e: Exception) {
            inferenceListener?.logging(this, "Error creating LLM inference session: ${e.message}")
            llmInference.close()
            throw e
        }
    }

    /**
     * Generates text asynchronously with streaming results via callback
     */
    fun generateResponseAsync(requestId: Int, prompt: String, callback: (String) -> Unit) {
        this.requestId = requestId
        this.requestResult = ""
        
        try {
            // Reset the session for a new query
            llmInferenceSession.close()
            
            // Create a new session with the same parameters
            val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
                .setTemperature(temperature)
                .setTopK(topK)
                .build()
                
            llmInferenceSession = LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
            
            // Add the prompt to the session
            llmInferenceSession.addQueryChunk(prompt)
            
            // Define the progress listener for streaming results
            val progressListener = ProgressListener<String> { result, isFinished ->
                inferenceListener?.onResults(this, requestId, result)
                requestResult += result
                
                if (isFinished) {
                    callback(requestResult)
                }
            }
            
            // Generate the response asynchronously
            llmInferenceSession.generateResponseAsync(progressListener)
        } catch (e: Exception) {
            inferenceListener?.onError(this, requestId, e.message ?: "")
            callback("")
        }
    }
    
    /**
     * Generates text synchronously and returns the complete response
     */
    fun generateResponse(requestId: Int, prompt: String): String {
        this.requestId = requestId
        this.requestResult = ""
        
        return try {
            // Reset the session for a new query
            llmInferenceSession.close()
            
            // Create a new session with the same parameters
            val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
                .setTemperature(temperature)
                .setTopK(topK)
                .build()
                
            llmInferenceSession = LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
            
            // Add the prompt to the session
            llmInferenceSession.addQueryChunk(prompt)
            
            val stringBuilder = StringBuilder()

            // Generate the response synchronously
            val result = llmInferenceSession.generateResponse()
            stringBuilder.append(result)
            
            stringBuilder.toString()
        } catch (e: Exception) {
            inferenceListener?.onError(this, requestId, e.message ?: "")
            throw e
        }
    }
    
    /**
     * Close resources when no longer needed
     */
    fun close() {
        try {
            llmInferenceSession.close()
            llmInference.close()
        } catch (e: Exception) {
            // Ignore close errors
            inferenceListener?.logging(this, "Error closing resources: ${e.message}")
        }
    }
}

interface InferenceListener {
    fun logging(model: LlmInferenceModel, message: String)
    fun onError(model: LlmInferenceModel, requestId: Int, error: String)
    fun onResults(model: LlmInferenceModel, requestId: Int, response: String)
}
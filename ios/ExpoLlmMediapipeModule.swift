import ExpoModulesCore
import MediaPipeTasksGenAI

public class ExpoLlmMediapipeModule: Module {
  private var modelMap = [Int: LlmInferenceModel]()
  private var nextHandle = 1
  
  public func definition() -> ModuleDefinition {
    Name("ExpoLlmMediapipe")
    
    Events("onChange", "onPartialResponse", "onErrorResponse", "logging")
    
    Function("hello") {
      return "Hello world from MediaPipe LLM on iOS! 👋"
    }
    
    AsyncFunction("createModel") { (modelPath: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise) in
      do {
        let modelHandle = nextHandle
        nextHandle += 1
        
        let model = try LlmInferenceModel(
          modelPath: modelPath,
          maxTokens: maxTokens,
          topK: topK,
          temperature: Float(temperature),
          randomSeed: randomSeed,
          eventEmitter: { [weak self] eventName, params in
            self?.sendEvent(eventName, params)
          },
          modelHandle: modelHandle
        )
        
        modelMap[modelHandle] = model
        promise.resolve(modelHandle)
      } catch {
        // Fixed: Remove third parameter
        promise.reject("MODEL_ERROR", "Failed to create model: \(error)")
      }
    }
    
    AsyncFunction("createModelFromAsset") { (modelName: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise) in
      do {
        // Get path to the model in the app bundle
        guard let modelURL = Bundle.main.url(forResource: modelName, withExtension: nil) else {
          promise.reject("MODEL_NOT_FOUND", "Model not found in app bundle: \(modelName)")
          return
        }
        
        let modelPath = modelURL.path
        let modelHandle = nextHandle
        nextHandle += 1
        
        let model = try LlmInferenceModel(
          modelPath: modelPath,
          maxTokens: maxTokens,
          topK: topK,
          temperature: Float(temperature),
          randomSeed: randomSeed,
          eventEmitter: { [weak self] eventName, params in
            self?.sendEvent(eventName, params)
          },
          modelHandle: modelHandle
        )
        
        modelMap[modelHandle] = model
        promise.resolve(modelHandle)
      } catch {
        // Fixed: Remove third parameter
        promise.reject("MODEL_ERROR", "Failed to create model: \(error)")
      }
    }
    
    AsyncFunction("releaseModel") { (handle: Int, promise: Promise) in
      if modelMap[handle] != nil {
        modelMap.removeValue(forKey: handle)
        promise.resolve(true)
      } else {
        promise.reject("INVALID_HANDLE", "No model found for handle \(handle)")
      }
    }
    
    AsyncFunction("generateResponse") { (handle: Int, requestId: Int, prompt: String, promise: Promise) in
      guard let model = modelMap[handle] else {
        promise.reject("INVALID_HANDLE", "No model found for handle \(handle)")
        return
      }
      
      do {
        try model.generateResponse(requestId: requestId, prompt: prompt) { result in
          switch result {
          case .success(let response):
            promise.resolve(response)
          case .failure(let error):
            // Fixed: Remove third parameter
            promise.reject("GENERATION_ERROR", error.localizedDescription)
          }
        }
      } catch {
        // Fixed: Remove third parameter
        promise.reject("GENERATION_ERROR", "Failed to generate response: \(error.localizedDescription)")
      }
    }
    
    AsyncFunction("generateResponseAsync") { (handle: Int, requestId: Int, prompt: String, promise: Promise) in
      guard let model = modelMap[handle] else {
        promise.reject("INVALID_HANDLE", "No model found for handle \(handle)")
        return
      }
      
      do {
        try model.generateStreamingResponse(requestId: requestId, prompt: prompt) { completed in
          if completed {
            promise.resolve(true)
          } else {
            promise.reject("GENERATION_INCOMPLETE", "Generation did not complete successfully")
          }
        }
      } catch {
        // Fixed: Remove third parameter
        promise.reject("GENERATION_ERROR", "Failed to generate response: \(error.localizedDescription)")
      }
    }
    
    // Helper function for debugging
    Function("printModelInfo") {
      let modelPaths = try? FileManager.default.contentsOfDirectory(atPath: Bundle.main.resourcePath ?? "")
      let models = modelPaths?.filter { $0.hasSuffix(".bin") || $0.hasSuffix(".task") }
      return [
        "bundle_path": Bundle.main.resourcePath ?? "unknown", 
        "models_found": models ?? [],
        "api_available": NSClassFromString("LlmInference") != nil
      ]
    }
  }
}

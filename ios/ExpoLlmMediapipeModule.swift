import ExpoModulesCore
import MediaPipeTasksGenAI

public class ExpoLlmMediapipeModule: Module {
  private var modelMap = [Int: LlmInferenceModel]()
  private var nextHandle = 1
  private var activeDownloads: [String: URLSessionDownloadTask] = [:]
  private var downloadObservers: [String: NSKeyValueObservation] = [:]

  private func getModelDirectory() -> URL {
    let fileManager = FileManager.default
    let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let modelDirURL = documentsURL.appendingPathComponent("llm_models")
    if !fileManager.fileExists(atPath: modelDirURL.path) {
      try? fileManager.createDirectory(at: modelDirURL, withIntermediateDirectories: true)
    }
    return modelDirURL
  }

  private func getModelURL(modelName: String) -> URL {
    return getModelDirectory().appendingPathComponent(modelName)
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoLlmMediapipe")

    Events("downloadProgress", "onChange", "onPartialResponse", "onErrorResponse", "logging")

    Function("hello") {
      return "Hello world from MediaPipe LLM on iOS! 👋"
    }

    AsyncFunction("createModel", createModel)
    AsyncFunction("createModelFromAsset", createModelFromAsset)
    AsyncFunction("releaseModel", releaseModel)
    AsyncFunction("generateResponse", generateResponse)
    AsyncFunction("generateResponseAsync", generateResponseAsync)
    AsyncFunction("isModelDownloaded", isModelDownloaded)
    AsyncFunction("getDownloadedModels", getDownloadedModels)
    AsyncFunction("deleteDownloadedModel", deleteDownloadedModel)
    AsyncFunction("downloadModel", downloadModel)
    AsyncFunction("cancelDownload", cancelDownload)
    AsyncFunction("createModelFromDownloaded", createModelFromDownloaded)

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

  private func createModel(modelPath: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise) {
    do {
      let modelHandle = nextHandle
      nextHandle += 1
      let model = try LlmInferenceModel(
        modelPath: modelPath,
        maxTokens: maxTokens,
        topK: topK,
        temperature: Float(temperature),
        randomSeed: randomSeed,
        eventEmitter: { [weak self] eventName, params in self?.sendEvent(eventName, params) },
        modelHandle: modelHandle
      )
      modelMap[modelHandle] = model
      promise.resolve(modelHandle)
    } catch {
      promise.reject("MODEL_ERROR", "Failed to create model: \(error)")
    }
  }

  private func createModelFromAsset(modelName: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int, promise: Promise) {
    guard let modelURL = Bundle.main.url(forResource: modelName, withExtension: nil) else {
      promise.reject("MODEL_NOT_FOUND", "Model not found in app bundle: \(modelName)")
      return
    }
    createModel(modelPath: modelURL.path, maxTokens: maxTokens, topK: topK, temperature: temperature, randomSeed: randomSeed, promise: promise)
  }

  private func releaseModel(handle: Int, promise: Promise) {
    if modelMap[handle] != nil {
      modelMap.removeValue(forKey: handle)
      promise.resolve(true)
    } else {
      promise.reject("INVALID_HANDLE", "No model found for handle \(handle)")
    }
  }

  private func generateResponse(handle: Int, requestId: Int, prompt: String, promise: Promise) {
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
          promise.reject("GENERATION_ERROR", error.localizedDescription)
        }
      }
    } catch {
      promise.reject("GENERATION_ERROR", "Failed to generate response: \(error.localizedDescription)")
    }
  }

  private func generateResponseAsync(handle: Int, requestId: Int, prompt: String, promise: Promise) {
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
      promise.reject("GENERATION_ERROR", "Failed to generate response: \(error.localizedDescription)")
    }
  }

  private func isModelDownloaded(modelName: String, promise: Promise) {
    let modelURL = getModelURL(modelName: modelName)
    let exists = FileManager.default.fileExists(atPath: modelURL.path)
    promise.resolve(exists)
  }

  private func getDownloadedModels(promise: Promise) {
    let modelDir = getModelDirectory()
    let fileManager = FileManager.default
    do {
      let fileURLs = try fileManager.contentsOfDirectory(at: modelDir, includingPropertiesForKeys: nil)
      let modelNames = fileURLs.map { $0.lastPathComponent }
      promise.resolve(modelNames)
    } catch {
      promise.resolve([])
    }
  }

  private func deleteDownloadedModel(modelName: String, promise: Promise) {
    let modelURL = getModelURL(modelName: modelName)
    do {
      try FileManager.default.removeItem(at: modelURL)
      promise.resolve(true)
    } catch {
      promise.resolve(false)
    }
  }

  private func downloadModel(url: String, modelName: String, options: [String: Any]?, promise: Promise) {
      let modelURL = self.getModelURL(modelName: modelName)
      let overwrite = options?["overwrite"] as? Bool ?? false
      
      // Check if already downloading
      if self.activeDownloads[modelName] != nil {
        promise.reject("ERR_ALREADY_DOWNLOADING", "This model is already being downloaded")
        return
      }
      
      // Check if already exists
      if FileManager.default.fileExists(atPath: modelURL.path) && !overwrite {
        promise.resolve(true)
        return
      }
      
      // Create URL session for download
      guard let downloadURL = URL(string: url) else {
        promise.reject("ERR_INVALID_URL", "Invalid URL provided")
        return
      }
      
      var request = URLRequest(url: downloadURL)
      
      // Add custom headers if provided
      if let headers = options?["headers"] as? [String: String] {
        for (key, value) in headers {
          request.setValue(value, forHTTPHeaderField: key)
        }
      }
      
      // Set timeout
      if let timeout = options?["timeout"] as? TimeInterval {
        request.timeoutInterval = timeout / 1000.0
      }
      
      // Create download task
      let session = URLSession(configuration: .default)
      let task = session.downloadTask(with: request) { (tempURL, response, error) in
        // Remove from active downloads
        self.activeDownloads.removeValue(forKey: modelName)
        self.downloadObservers.removeValue(forKey: modelName)?.invalidate()
        
        if let error = error {
          self.sendEvent("downloadProgress", [
            "modelName": modelName,
            "url": url,
            "status": "error",
            "error": error.localizedDescription
          ])
          promise.reject("ERR_DOWNLOAD", "Download failed: \(error.localizedDescription)")
          return
        }
        
        guard let tempURL = tempURL else {
          self.sendEvent("downloadProgress", [
            "modelName": modelName,
            "url": url,
            "status": "error",
            "error": "No file downloaded"
          ])
          promise.reject("ERR_DOWNLOAD", "Download failed: No file received")
          return
        }
        
        do {
          // If file already exists, remove it
          if FileManager.default.fileExists(atPath: modelURL.path) {
            try FileManager.default.removeItem(at: modelURL)
          }
          
          // Move downloaded file to final location
          try FileManager.default.moveItem(at: tempURL, to: modelURL)
          
          self.sendEvent("downloadProgress", [
            "modelName": modelName,
            "url": url,
            "bytesDownloaded": try FileManager.default.attributesOfItem(atPath: modelURL.path)[.size] as? Int64 ?? 0,
            "totalBytes": try FileManager.default.attributesOfItem(atPath: modelURL.path)[.size] as? Int64 ?? 0,
            "progress": 1.0,
            "status": "completed"
          ])
          
          promise.resolve(true)
        } catch {
          self.sendEvent("downloadProgress", [
            "modelName": modelName,
            "url": url,
            "status": "error",
            "error": error.localizedDescription
          ])
          promise.reject("ERR_SAVE_FILE", "Failed to save downloaded model: \(error.localizedDescription)")
        }
      }
      
      // Observe download progress
      let observation = task.progress.observe(\.fractionCompleted) { progress, _ in
        DispatchQueue.main.async {
          self.sendEvent("downloadProgress", [
            "modelName": modelName,
            "url": url,
            "bytesDownloaded": task.countOfBytesReceived,
            "totalBytes": task.countOfBytesExpectedToReceive,
            "progress": progress.fractionCompleted,
            "status": "downloading"
          ])
        }
      }
      
      // Store task and observer
      self.activeDownloads[modelName] = task
      self.downloadObservers[modelName] = observation
      
      // Start download
      task.resume()
  }

  private func cancelDownload(modelName: String, promise: Promise) {
    if let task = activeDownloads[modelName] {
      task.cancel()
      activeDownloads.removeValue(forKey: modelName)
      downloadObservers.removeValue(forKey: modelName)?.invalidate()
      sendEvent("downloadProgress", ["modelName": modelName, "status": "cancelled"])
      promise.resolve(true)
    } else {
      promise.resolve(false)
    }
  }

  private func createModelFromDownloaded(modelName: String, maxTokens: Int?, topK: Int?, temperature: Double?, randomSeed: Int?, promise: Promise) {
    let modelURL = getModelURL(modelName: modelName)
    if !FileManager.default.fileExists(atPath: modelURL.path) {
      promise.reject("ERR_MODEL_NOT_FOUND", "Model \(modelName) is not downloaded")
      return
    }
    do {
      let handle = try self.createModelInternal(
        modelPath: modelURL.path,
        maxTokens: maxTokens ?? 1024,
        topK: topK ?? 40,
        temperature: temperature ?? 0.7,
        randomSeed: randomSeed ?? 42
      )
      promise.resolve(handle)
    } catch {
      promise.reject("ERR_CREATE_MODEL", "Failed to create model: \(error.localizedDescription)")
    }
  }

  private func createModelInternal(modelPath: String, maxTokens: Int, topK: Int, temperature: Double, randomSeed: Int) throws -> Int {
    let modelHandle = nextHandle
    nextHandle += 1
    let model = try LlmInferenceModel(
      modelPath: modelPath,
      maxTokens: maxTokens,
      topK: topK,
      temperature: Float(temperature),
      randomSeed: randomSeed,
      eventEmitter: { [weak self] eventName, params in self?.sendEvent(eventName, params) },
      modelHandle: modelHandle
    )
    modelMap[modelHandle] = model
    return modelHandle
  }
}

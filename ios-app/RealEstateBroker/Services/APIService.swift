import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = Configuration.apiBaseURL
    
    private init() {}
    
    // MARK: - Authentication
    
    func login(email: String, password: String) async throws -> (token: String, user: User) {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        print("🔵 Login Request:")
        print("URL: \(url)")
        print("Body: \(String(data: request.httpBody!, encoding: .utf8) ?? "")")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Print response for debugging
        if let httpResponse = response as? HTTPURLResponse {
            print("📡 Response Status: \(httpResponse.statusCode)")
        }
        print("📦 Response Data: \(String(data: data, encoding: .utf8) ?? "")")
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        guard httpResponse.statusCode == 200 else {
            // Try to parse error message
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMessage = json["error"] as? String {
                throw NSError(domain: "APIError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage])
            }
            throw NSError(domain: "APIError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Login failed"])
        }
        
        // Parse the response
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON"])
        }
        
        guard let token = json["token"] as? String,
              let userDict = json["user"] as? [String: Any] else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Missing token or user in response"])
        }
        
        // Parse user object
        guard let id = userDict["id"] as? String,
              let userEmail = userDict["email"] as? String,
              let roleString = userDict["role"] as? String,
              let fullName = userDict["full_name"] as? String else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid user data"])
        }
        
        // Convert role string to UserRole enum
        let role: UserRole = roleString.lowercased() == "admin" ? .admin : .broker
        
        // Create user with correct parameter order: id, email, name, role
        let user = User(
            id: id,
            email: userEmail,
            name: fullName,
            role: role
        )
        
        return (token, user)
    }
    
    // MARK: - Leads
    
    func fetchLeads(token: String) async throws -> [Lead] {
        let url = URL(string: "\(baseURL)/broker/leads")!  // Changed to broker-specific endpoint
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        print("🔵 Fetching leads...")
        print("URL: \(url)")
        print("Token: Bearer \(token.prefix(20))...")
        
        // Decode token to see what email it contains (for debugging)
        if let tokenParts = token.components(separatedBy: ".").dropFirst().first,
           let decodedData = Data(base64Encoded: tokenParts.padding(toLength: ((tokenParts.count + 3) / 4) * 4, withPad: "=", startingAt: 0)),
           let tokenJson = try? JSONSerialization.jsonObject(with: decodedData) as? [String: Any] {
            print("📧 Token contains email: \(tokenJson["email"] as? String ?? "unknown")")
            print("👤 Token contains role: \(tokenJson["role"] as? String ?? "unknown")")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "APIError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        print("📡 Leads Response Status: \(httpResponse.statusCode)")
        print("📦 Response Data: \(String(data: data, encoding: .utf8) ?? "")")
        
        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "APIError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Failed to fetch leads"])
        }
        
        let decoder = JSONDecoder()
        // Don't use convertFromSnakeCase - we have explicit CodingKeys in Lead model
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Multiple date formatters to handle different formats
            let formatters: [ISO8601DateFormatter] = [
                // Format 1: With fractional seconds and timezone (e.g., "2026-01-26T17:38:59.589348+00:00")
                {
                    let f = ISO8601DateFormatter()
                    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withColonSeparatorInTimeZone]
                    return f
                }(),
                // Format 2: Without fractional seconds but with timezone (e.g., "2026-01-05T00:00:00+00:00")
                {
                    let f = ISO8601DateFormatter()
                    f.formatOptions = [.withInternetDateTime, .withColonSeparatorInTimeZone]
                    return f
                }(),
                // Format 3: Standard ISO8601 with fractional seconds
                {
                    let f = ISO8601DateFormatter()
                    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                    return f
                }(),
                // Format 4: Standard ISO8601 without fractional seconds
                {
                    let f = ISO8601DateFormatter()
                    f.formatOptions = [.withInternetDateTime]
                    return f
                }()
            ]
            
            // Try each formatter
            for formatter in formatters {
                if let date = formatter.date(from: dateString) {
                    return date
                }
            }
            
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string: \(dateString)"
            )
        }
        
        let leads = try decoder.decode([Lead].self, from: data)
        print("✅ Fetched \(leads.count) leads")
        return leads
    }
}

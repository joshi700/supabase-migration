import Foundation

struct User: Codable {
    let id: String
    let email: String
    let name: String
    let role: UserRole
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case name = "full_name"
        case role
    }
}

enum UserRole: String, Codable {
    case admin = "admin"
    case broker = "broker"
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}

struct APIError: Codable {
    let error: String
}

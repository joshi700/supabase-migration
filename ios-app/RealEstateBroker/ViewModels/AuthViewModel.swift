import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    init() {
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        if let token = KeychainHelper.shared.getToken(),
           !token.isEmpty {
            isAuthenticated = true
            // Optionally validate token with backend
        }
    }
    
    func login(email: String, password: String) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await apiService.login(email: email, password: password)
                
                // Save token
                KeychainHelper.shared.saveToken(response.token)
                
                // Update state
                self.currentUser = response.user
                self.isAuthenticated = true
                self.isLoading = false
            } catch {
                self.isLoading = false
                self.errorMessage = error.localizedDescription
            }
        }
    }
    
    func logout() {
        KeychainHelper.shared.deleteToken()
        isAuthenticated = false
        currentUser = nil
    }
}

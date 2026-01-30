import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.blue.opacity(0.6),
                        Color.purple.opacity(0.4)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        Spacer()
                            .frame(height: geometry.size.height * 0.1)
                        
                        // App Icon/Logo
                        VStack(spacing: 10) {
                            Image(systemName: "house.fill")
                                .font(.system(size: min(geometry.size.width, geometry.size.height) * 0.15))
                                .foregroundColor(.white)
                            
                            Text("Real Estate Broker")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Manage Your Leads")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))
                        }
                        .padding(.bottom, 40)
                        
                        // Login Form
                        VStack(spacing: 20) {
                            // Email Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Email")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.white)
                                
                                HStack {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.white.opacity(0.7))
                                    
                                    TextField("broker@example.com", text: $email)
                                        .textContentType(.emailAddress)
                                        .autocapitalization(.none)
                                        .keyboardType(.emailAddress)
                                        .foregroundColor(.white)
                                }
                                .padding()
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(10)
                            }
                            
                            // Password Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Password")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.white)
                                
                                HStack {
                                    Image(systemName: "lock.fill")
                                        .foregroundColor(.white.opacity(0.7))
                                    
                                    if showPassword {
                                        TextField("Enter password", text: $password)
                                            .textContentType(.password)
                                            .foregroundColor(.white)
                                    } else {
                                        SecureField("Enter password", text: $password)
                                            .textContentType(.password)
                                            .foregroundColor(.white)
                                    }
                                    
                                    Button(action: {
                                        showPassword.toggle()
                                    }) {
                                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                            .foregroundColor(.white.opacity(0.7))
                                    }
                                }
                                .padding()
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(10)
                            }
                            
                            // Error Message
                            if let errorMessage = authViewModel.errorMessage {
                                Text(errorMessage)
                                    .font(.caption)
                                    .foregroundColor(.red)
                                    .padding(.horizontal)
                                    .padding(.vertical, 8)
                                    .background(Color.white.opacity(0.9))
                                    .cornerRadius(8)
                            }
                            
                            // Login Button
                            Button(action: {
                                authViewModel.login(email: email, password: password)
                            }) {
                                HStack {
                                    if authViewModel.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Text("Sign In")
                                            .fontWeight(.semibold)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.3))
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)
                            .opacity((email.isEmpty || password.isEmpty || authViewModel.isLoading) ? 0.6 : 1.0)
                        }
                        .frame(maxWidth: 500) // Max width for better iPad layout
                        .padding(.horizontal, 30)
                        
                        Spacer()
                            .frame(height: geometry.size.height * 0.1)
                    }
                    .frame(minHeight: geometry.size.height)
                }
            }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}

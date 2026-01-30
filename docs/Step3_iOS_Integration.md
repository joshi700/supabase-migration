# Step 3: iOS App Integration with Supabase

## Overview

In this step, we'll:
1. Install Supabase Swift SDK
2. Create Supabase client manager
3. Update all ViewModels to use Supabase
4. Add real-time subscriptions for instant updates
5. Test the complete flow

**Estimated Time: 4-6 hours**

---

## 3.1 Install Supabase Swift SDK

### Using Xcode:

1. Open your project: `ios-app/RealEstateBroker.xcodeproj`

2. Go to **File** → **Add Package Dependencies...**

3. In the search bar, enter:
   ```
   https://github.com/supabase/supabase-swift
   ```

4. Click **Add Package**

5. Select these libraries:
   - ✅ **Supabase** (main library)
   - ✅ **Realtime** (for real-time subscriptions)
   - ✅ **PostgREST** (for database queries)
   - ✅ **Auth** (for authentication - optional)

6. Click **Add Package** again

7. Wait for Xcode to download and integrate the package

### Verify Installation:

Build the project (Cmd+B) to ensure packages are properly installed.

---

## 3.2 Create Supabase Manager

Create a new file: `Services/SupabaseManager.swift`

```swift
//
//  SupabaseManager.swift
//  RealEstateBroker
//
//  Centralized Supabase client for the entire app
//

import Foundation
import Supabase

class SupabaseManager {
    static let shared = SupabaseManager()
    
    // MARK: - Configuration
    // TODO: Replace these with your actual Supabase credentials
    private let supabaseURL = "https://xxxxxxxxxxxxx.supabase.co"
    private let supabaseAnonKey = "eyJhbGc..." // Your anon key here
    
    // MARK: - Client
    let client: SupabaseClient
    
    private init() {
        guard let url = URL(string: supabaseURL) else {
            fatalError("Invalid Supabase URL")
        }
        
        self.client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    autoRefreshToken: true,
                    persistSession: true,
                    storage: KeychainStorage() // Use Keychain for secure storage
                )
            )
        )
        
        print("✅ Supabase client initialized")
    }
    
    // MARK: - Helper: Custom Keychain Storage
    class KeychainStorage: AuthStorage {
        private let keychainHelper = KeychainHelper.shared
        private let tokenKey = "supabase.auth.token"
        
        func store(key: String, value: Data) throws {
            keychainHelper.save(value, forKey: "\(tokenKey).\(key)")
        }
        
        func retrieve(key: String) throws -> Data? {
            return keychainHelper.load(forKey: "\(tokenKey).\(key)")
        }
        
        func remove(key: String) throws {
            keychainHelper.delete(forKey: "\(tokenKey).\(key)")
        }
    }
}

// MARK: - Convenience Extensions

extension SupabaseManager {
    /// Check if user is authenticated
    var isAuthenticated: Bool {
        return client.auth.currentSession != nil
    }
    
    /// Get current user email
    var currentUserEmail: String? {
        return client.auth.currentUser?.email
    }
    
    /// Get current user role (from JWT)
    var currentUserRole: String? {
        guard let session = client.auth.currentSession else { return nil }
        // Extract role from JWT token
        let jwt = session.accessToken
        if let payload = decodeJWT(jwt) {
            return payload["role"] as? String
        }
        return nil
    }
    
    /// Simple JWT decoder (for extracting role)
    private func decodeJWT(_ token: String) -> [String: Any]? {
        let segments = token.components(separatedBy: ".")
        guard segments.count > 1 else { return nil }
        
        var base64String = segments[1]
        // Add padding if needed
        let remainder = base64String.count % 4
        if remainder > 0 {
            base64String = base64String.padding(
                toLength: base64String.count + 4 - remainder,
                withPad: "=",
                startingAt: 0
            )
        }
        
        guard let data = Data(base64Encoded: base64String) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }
}
```

---

## 3.3 Update Configuration File

Create a new file: `Utils/Configuration.swift`

```swift
//
//  Configuration.swift
//  RealEstateBroker
//
//  Centralized configuration for the app
//

import Foundation

enum Configuration {
    // MARK: - Supabase
    static let supabaseURL = "https://xxxxxxxxxxxxx.supabase.co"
    static let supabaseAnonKey = "eyJhbGc..." // Your anon key
    
    // MARK: - API (Backup - if you still want to use REST API)
    static let apiBaseURL = "http://localhost:3001/api"
    
    // MARK: - App Settings
    static let appVersion = "2.0.0"
    static let useLegacyAPI = false // Set to true to use old REST API
}
```

---

## 3.4 Update Lead Model

Update `Models/Lead.swift` to work with Supabase:

```swift
//
//  Lead.swift
//  RealEstateBroker
//
//  Lead model matching Supabase schema
//

import Foundation

struct Lead: Identifiable, Codable, Equatable {
    let id: String // UUID from Supabase
    let leadID: String
    let brokerEmail: String
    let clientName: String
    let propertyAddress: String
    let status: LeadStatus
    let lastUpdated: Date
    
    // Expected dates
    let expectedOfferAcceptDate: Date?
    let expectedTitleDate: Date?
    let expectedInspectionOrderDate: Date?
    let expectedInspectionCompleteDate: Date?
    let expectedAppraisalOrderDate: Date?
    let expectedAppraisalCompleteDate: Date?
    let expectedClearToCloseDate: Date?
    let expectedClosingScheduledDate: Date?
    let expectedCloseDate: Date?
    
    // Actual dates
    let actualOfferAcceptDate: Date?
    let actualTitleDate: Date?
    let actualInspectionOrderDate: Date?
    let actualInspectionCompleteDate: Date?
    let actualAppraisalOrderDate: Date?
    let actualAppraisalCompleteDate: Date?
    let actualClearToCloseDate: Date?
    let actualClosingScheduledDate: Date?
    let actualCloseDate: Date?
    
    // MARK: - Coding Keys (Map to Supabase column names)
    enum CodingKeys: String, CodingKey {
        case id
        case leadID = "lead_id"
        case brokerEmail = "broker_email"
        case clientName = "client_name"
        case propertyAddress = "property_address"
        case status
        case lastUpdated = "last_updated"
        
        // Expected dates
        case expectedOfferAcceptDate = "expected_offer_accept_date"
        case expectedTitleDate = "expected_title_date"
        case expectedInspectionOrderDate = "expected_inspection_order_date"
        case expectedInspectionCompleteDate = "expected_inspection_complete_date"
        case expectedAppraisalOrderDate = "expected_appraisal_order_date"
        case expectedAppraisalCompleteDate = "expected_appraisal_complete_date"
        case expectedClearToCloseDate = "expected_clear_to_close_date"
        case expectedClosingScheduledDate = "expected_closing_scheduled_date"
        case expectedCloseDate = "expected_close_date"
        
        // Actual dates
        case actualOfferAcceptDate = "actual_offer_accept_date"
        case actualTitleDate = "actual_title_date"
        case actualInspectionOrderDate = "actual_inspection_order_date"
        case actualInspectionCompleteDate = "actual_inspection_complete_date"
        case actualAppraisalOrderDate = "actual_appraisal_order_date"
        case actualAppraisalCompleteDate = "actual_appraisal_complete_date"
        case actualClearToCloseDate = "actual_clear_to_close_date"
        case actualClosingScheduledDate = "actual_closing_scheduled_date"
        case actualCloseDate = "actual_close_date"
    }
    
    // MARK: - Equatable
    static func == (lhs: Lead, rhs: Lead) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Lead Status
enum LeadStatus: String, Codable, CaseIterable {
    case new = "New"
    case processing = "Processing"
    case inspection = "Inspection"
    case appraisal = "Appraisal"
    case clearToClose = "Clear to Close"
    case closing = "Closing"
    case closed = "Closed"
    case cancelled = "Cancelled"
    
    var color: String {
        switch self {
        case .new: return "blue"
        case .processing: return "orange"
        case .inspection: return "purple"
        case .appraisal: return "indigo"
        case .clearToClose: return "green"
        case .closing: return "teal"
        case .closed: return "gray"
        case .cancelled: return "red"
        }
    }
    
    var icon: String {
        switch self {
        case .new: return "star.fill"
        case .processing: return "doc.text.fill"
        case .inspection: return "magnifyingglass"
        case .appraisal: return "dollarsign.circle.fill"
        case .clearToClose: return "checkmark.circle.fill"
        case .closing: return "key.fill"
        case .closed: return "house.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }
}

// MARK: - Timeline Milestone
struct TimelineMilestone: Identifiable {
    let id = UUID()
    let title: String
    let expectedDate: Date?
    let actualDate: Date?
    let isCompleted: Bool
    
    var displayDate: Date? {
        actualDate ?? expectedDate
    }
    
    var statusText: String {
        if isCompleted {
            return "Completed"
        } else if let expected = expectedDate, expected < Date() {
            return "Overdue"
        } else {
            return "Pending"
        }
    }
}

// MARK: - Lead Extension (Helper methods)
extension Lead {
    /// Generate timeline milestones from lead data
    var timelineMilestones: [TimelineMilestone] {
        [
            TimelineMilestone(
                title: "Offer Accept",
                expectedDate: expectedOfferAcceptDate,
                actualDate: actualOfferAcceptDate,
                isCompleted: actualOfferAcceptDate != nil
            ),
            TimelineMilestone(
                title: "Title",
                expectedDate: expectedTitleDate,
                actualDate: actualTitleDate,
                isCompleted: actualTitleDate != nil
            ),
            TimelineMilestone(
                title: "Inspection Order",
                expectedDate: expectedInspectionOrderDate,
                actualDate: actualInspectionOrderDate,
                isCompleted: actualInspectionOrderDate != nil
            ),
            TimelineMilestone(
                title: "Inspection Complete",
                expectedDate: expectedInspectionCompleteDate,
                actualDate: actualInspectionCompleteDate,
                isCompleted: actualInspectionCompleteDate != nil
            ),
            TimelineMilestone(
                title: "Appraisal Order",
                expectedDate: expectedAppraisalOrderDate,
                actualDate: actualAppraisalOrderDate,
                isCompleted: actualAppraisalOrderDate != nil
            ),
            TimelineMilestone(
                title: "Appraisal Complete",
                expectedDate: expectedAppraisalCompleteDate,
                actualDate: actualAppraisalCompleteDate,
                isCompleted: actualAppraisalCompleteDate != nil
            ),
            TimelineMilestone(
                title: "Clear to Close",
                expectedDate: expectedClearToCloseDate,
                actualDate: actualClearToCloseDate,
                isCompleted: actualClearToCloseDate != nil
            ),
            TimelineMilestone(
                title: "Closing Scheduled",
                expectedDate: expectedClosingScheduledDate,
                actualDate: actualClosingScheduledDate,
                isCompleted: actualClosingScheduledDate != nil
            ),
            TimelineMilestone(
                title: "Close Date",
                expectedDate: expectedCloseDate,
                actualDate: actualCloseDate,
                isCompleted: actualCloseDate != nil
            )
        ]
    }
    
    /// Calculate completion percentage
    var completionPercentage: Double {
        let milestones = timelineMilestones
        let completed = milestones.filter { $0.isCompleted }.count
        return Double(completed) / Double(milestones.count)
    }
}
```

---

## 3.5 Update User Model

Update `Models/User.swift`:

```swift
//
//  User.swift
//  RealEstateBroker
//
//  User model matching Supabase schema
//

import Foundation

struct User: Identifiable, Codable {
    let id: String // UUID from Supabase
    let email: String
    let role: UserRole
    let fullName: String?
    let phone: String?
    let active: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case role
        case fullName = "full_name"
        case phone
        case active
    }
}

enum UserRole: String, Codable {
    case admin = "admin"
    case broker = "broker"
}
```

---

## 3.6 Update AuthViewModel

Replace `ViewModels/AuthViewModel.swift`:

```swift
//
//  AuthViewModel.swift
//  RealEstateBroker
//
//  Handles authentication with Supabase
//

import Foundation
import SwiftUI
import Supabase

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared.client
    private let keychain = KeychainHelper.shared
    
    init() {
        checkAuthStatus()
    }
    
    // MARK: - Check Auth Status
    func checkAuthStatus() {
        // Check if we have a saved token
        if let tokenData = keychain.load(forKey: "auth_token"),
           let token = String(data: tokenData, encoding: .utf8) {
            isAuthenticated = true
            // Optionally fetch user profile
            Task {
                await fetchCurrentUser()
            }
        }
    }
    
    // MARK: - Login with JWT (Backend)
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Call your backend API for login
            guard let url = URL(string: "\(Configuration.apiBaseURL)/auth/login") else {
                throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body = ["email": email, "password": password]
            request.httpBody = try JSONEncoder().encode(body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Login failed"])
            }
            
            let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
            
            // Save token to keychain
            if let tokenData = loginResponse.token.data(using: .utf8) {
                keychain.save(tokenData, forKey: "auth_token")
            }
            
            // Update state
            self.currentUser = loginResponse.user
            self.isAuthenticated = true
            
            print("✅ Login successful: \(email)")
            
        } catch {
            print("❌ Login error: \(error.localizedDescription)")
            errorMessage = "Login failed. Please check your credentials."
        }
        
        isLoading = false
    }
    
    // MARK: - Fetch Current User
    func fetchCurrentUser() async {
        guard let tokenData = keychain.load(forKey: "auth_token"),
              let token = String(data: tokenData, encoding: .utf8) else {
            return
        }
        
        do {
            guard let url = URL(string: "\(Configuration.apiBaseURL)/auth/me") else { return }
            
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (data, _) = try await URLSession.shared.data(for: request)
            let user = try JSONDecoder().decode(User.self, from: data)
            
            self.currentUser = user
            
        } catch {
            print("❌ Error fetching user: \(error)")
        }
    }
    
    // MARK: - Logout
    func logout() {
        keychain.delete(forKey: "auth_token")
        isAuthenticated = false
        currentUser = nil
        print("✅ Logged out successfully")
    }
}

// MARK: - Login Response Model
struct LoginResponse: Codable {
    let token: String
    let user: User
}
```

---

## 3.7 Update LeadsViewModel with Real-time

Replace `ViewModels/LeadsViewModel.swift`:

```swift
//
//  LeadsViewModel.swift
//  RealEstateBroker
//
//  Manages leads with real-time Supabase updates
//

import Foundation
import SwiftUI
import Supabase
import Realtime

@MainActor
class LeadsViewModel: ObservableObject {
    @Published var leads: [Lead] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedStatus: LeadStatus?
    @Published var searchText = ""
    
    private let supabase = SupabaseManager.shared.client
    private let keychain = KeychainHelper.shared
    private var realtimeChannel: RealtimeChannelV2?
    
    // MARK: - Computed Properties
    var filteredLeads: [Lead] {
        var filtered = leads
        
        // Filter by status
        if let status = selectedStatus {
            filtered = filtered.filter { $0.status == status }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { lead in
                lead.clientName.localizedCaseInsensitiveContains(searchText) ||
                lead.propertyAddress.localizedCaseInsensitiveContains(searchText) ||
                lead.leadID.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return filtered
    }
    
    var leadsByStatus: [LeadStatus: [Lead]] {
        Dictionary(grouping: leads, by: { $0.status })
    }
    
    // MARK: - Fetch Leads
    func fetchLeads() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Get auth token
            guard let tokenData = keychain.load(forKey: "auth_token"),
                  let token = String(data: tokenData, encoding: .utf8) else {
                throw NSError(domain: "", code: 401, userInfo: [NSLocalizedDescriptionKey: "Not authenticated"])
            }
            
            // Fetch from backend API (which uses Supabase)
            guard let url = URL(string: "\(Configuration.apiBaseURL)/broker/leads") else {
                throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
            }
            
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to fetch leads"])
            }
            
            // Decode with custom date strategy
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            let fetchedLeads = try decoder.decode([Lead].self, from: data)
            self.leads = fetchedLeads
            
            print("✅ Fetched \(fetchedLeads.count) leads")
            
        } catch {
            print("❌ Error fetching leads: \(error)")
            errorMessage = "Failed to load leads. Please try again."
        }
        
        isLoading = false
    }
    
    // MARK: - Subscribe to Real-time Updates
    func subscribeToRealtimeUpdates(brokerEmail: String) {
        print("🔔 Subscribing to real-time updates for: \(brokerEmail)")
        
        // Create a channel for this broker's leads
        realtimeChannel = supabase.realtime.channel("leads:\(brokerEmail)")
        
        // Listen to INSERT events
        let insertSubscription = realtimeChannel?.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "leads",
            filter: "broker_email=eq.\(brokerEmail)"
        ) { [weak self] payload in
            Task { @MainActor in
                print("🆕 New lead inserted")
                // Refresh leads to get the new one
                await self?.fetchLeads()
            }
        }
        
        // Listen to UPDATE events
        let updateSubscription = realtimeChannel?.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "leads",
            filter: "broker_email=eq.\(brokerEmail)"
        ) { [weak self] payload in
            Task { @MainActor in
                print("🔄 Lead updated")
                // Refresh leads to get the update
                await self?.fetchLeads()
            }
        }
        
        // Listen to DELETE events
        let deleteSubscription = realtimeChannel?.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "leads",
            filter: "broker_email=eq.\(brokerEmail)"
        ) { [weak self] payload in
            Task { @MainActor in
                print("🗑️ Lead deleted")
                // Refresh leads
                await self?.fetchLeads()
            }
        }
        
        // Subscribe to the channel
        Task {
            do {
                try await realtimeChannel?.subscribe()
                print("✅ Successfully subscribed to real-time updates")
            } catch {
                print("❌ Failed to subscribe to real-time: \(error)")
            }
        }
    }
    
    // MARK: - Unsubscribe from Real-time
    func unsubscribeFromRealtime() {
        Task {
            do {
                try await realtimeChannel?.unsubscribe()
                realtimeChannel = nil
                print("✅ Unsubscribed from real-time updates")
            } catch {
                print("❌ Error unsubscribing: \(error)")
            }
        }
    }
    
    // MARK: - Get Single Lead
    func getLead(id: String) async -> Lead? {
        do {
            guard let tokenData = keychain.load(forKey: "auth_token"),
                  let token = String(data: tokenData, encoding: .utf8) else {
                return nil
            }
            
            guard let url = URL(string: "\(Configuration.apiBaseURL)/broker/leads/\(id)") else {
                return nil
            }
            
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (data, _) = try await URLSession.shared.data(for: request)
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            return try decoder.decode(Lead.self, from: data)
            
        } catch {
            print("❌ Error fetching lead: \(error)")
            return nil
        }
    }
    
    // MARK: - Refresh
    func refresh() async {
        await fetchLeads()
    }
}
```

---

## 3.8 Update LeadsListView

Update `Views/LeadsListView.swift`:

```swift
//
//  LeadsListView.swift
//  RealEstateBroker
//
//  Main leads list view with real-time updates
//

import SwiftUI

struct LeadsListView: View {
    @StateObject private var viewModel = LeadsViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingFilterSheet = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.leads.isEmpty {
                    ProgressView("Loading leads...")
                } else if viewModel.leads.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "tray")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("No leads assigned")
                            .font(.headline)
                        Text("New leads will appear here automatically")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                } else {
                    List {
                        // Status filter
                        if viewModel.selectedStatus != nil {
                            Section {
                                HStack {
                                    Text("Filtered by: \(viewModel.selectedStatus?.rawValue ?? "")")
                                    Spacer()
                                    Button("Clear") {
                                        viewModel.selectedStatus = nil
                                    }
                                    .font(.caption)
                                }
                            }
                        }
                        
                        // Leads list
                        ForEach(viewModel.filteredLeads) { lead in
                            NavigationLink(destination: LeadDetailView(leadId: lead.id)) {
                                LeadRowView(lead: lead)
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }
            }
            .navigationTitle("My Leads")
            .searchable(text: $viewModel.searchText, prompt: "Search leads...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingFilterSheet = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
                
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        authViewModel.logout()
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .sheet(isPresented: $showingFilterSheet) {
                StatusFilterView(selectedStatus: $viewModel.selectedStatus)
            }
            .task {
                await viewModel.fetchLeads()
                
                // Subscribe to real-time updates
                if let email = authViewModel.currentUser?.email {
                    viewModel.subscribeToRealtimeUpdates(brokerEmail: email)
                }
            }
            .onDisappear {
                viewModel.unsubscribeFromRealtime()
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }
}

// MARK: - Lead Row View
struct LeadRowView: View {
    let lead: Lead
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(lead.clientName)
                    .font(.headline)
                Spacer()
                StatusBadge(status: lead.status)
            }
            
            Text(lead.propertyAddress)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            HStack {
                Image(systemName: "clock")
                    .font(.caption)
                Text("Updated \(lead.lastUpdated.formatted(.relative(presentation: .named)))")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Spacer()
                
                // Progress indicator
                ProgressBar(progress: lead.completionPercentage)
                    .frame(width: 60, height: 8)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: LeadStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
                .font(.caption2)
            Text(status.rawValue)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(status.color).opacity(0.2))
        .foregroundColor(Color(status.color))
        .cornerRadius(8)
    }
}

// MARK: - Progress Bar
struct ProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .cornerRadius(4)
                
                Rectangle()
                    .fill(Color.blue)
                    .frame(width: geometry.size.width * progress)
                    .cornerRadius(4)
            }
        }
    }
}

// MARK: - Status Filter View
struct StatusFilterView: View {
    @Binding var selectedStatus: LeadStatus?
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Button {
                    selectedStatus = nil
                    dismiss()
                } label: {
                    HStack {
                        Text("All Leads")
                        Spacer()
                        if selectedStatus == nil {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                }
                
                ForEach(LeadStatus.allCases, id: \.self) { status in
                    Button {
                        selectedStatus = status
                        dismiss()
                    } label: {
                        HStack {
                            StatusBadge(status: status)
                            Spacer()
                            if selectedStatus == status {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filter by Status")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    LeadsListView()
        .environmentObject(AuthViewModel())
}
```

---

## 3.9 Update LeadDetailView

Update `Views/LeadDetailView.swift`:

```swift
//
//  LeadDetailView.swift
//  RealEstateBroker
//
//  Detailed view of a single lead with timeline
//

import SwiftUI

struct LeadDetailView: View {
    let leadId: String
    
    @StateObject private var viewModel = LeadsViewModel()
    @State private var lead: Lead?
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading lead...")
            } else if let lead = lead {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text(lead.clientName)
                                .font(.title)
                                .fontWeight(.bold)
                            
                            Text(lead.propertyAddress)
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            StatusBadge(status: lead.status)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemBackground))
                        
                        Divider()
                        
                        // Lead Info
                        VStack(alignment: .leading, spacing: 12) {
                            InfoRow(label: "Lead ID", value: lead.leadID)
                            InfoRow(label: "Broker", value: lead.brokerEmail)
                            InfoRow(
                                label: "Last Updated",
                                value: lead.lastUpdated.formatted(date: .abbreviated, time: .shortened)
                            )
                            
                            // Progress
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Progress")
                                        .font(.headline)
                                    Spacer()
                                    Text("\(Int(lead.completionPercentage * 100))%")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                }
                                
                                ProgressBar(progress: lead.completionPercentage)
                                    .frame(height: 12)
                            }
                        }
                        .padding()
                        
                        Divider()
                        
                        // Timeline
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Timeline")
                                .font(.title2)
                                .fontWeight(.bold)
                                .padding(.horizontal)
                            
                            ForEach(lead.timelineMilestones) { milestone in
                                TimelineMilestoneRow(milestone: milestone)
                            }
                        }
                        .padding(.vertical)
                    }
                }
            } else {
                VStack {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Lead not found")
                        .font(.headline)
                }
            }
        }
        .navigationTitle("Lead Details")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            lead = await viewModel.getLead(id: leadId)
            isLoading = false
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.gray)
            Spacer()
            Text(value)
                .font(.subheadline)
        }
    }
}

// MARK: - Timeline Milestone Row
struct TimelineMilestoneRow: View {
    let milestone: TimelineMilestone
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Status indicator
            ZStack {
                Circle()
                    .fill(milestone.isCompleted ? Color.green : Color.gray.opacity(0.3))
                    .frame(width: 24, height: 24)
                
                if milestone.isCompleted {
                    Image(systemName: "checkmark")
                        .font(.caption)
                        .foregroundColor(.white)
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(milestone.title)
                    .font(.headline)
                
                if let date = milestone.displayDate {
                    Text(date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Text(milestone.statusText)
                    .font(.caption)
                    .foregroundColor(milestone.isCompleted ? .green : .orange)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

#Preview {
    NavigationView {
        LeadDetailView(leadId: "sample-id")
    }
}
```

---

## 3.10 Update LoginView

Update `Views/LoginView.swift`:

```swift
//
//  LoginView.swift
//  RealEstateBroker
//
//  Login screen with Supabase authentication
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Spacer()
                
                // Logo/Icon
                Image(systemName: "house.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                    .padding(.bottom, 20)
                
                Text("Real Estate Broker")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Sign in to continue")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                Spacer()
                
                // Login Form
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .focused($focusedField, equals: .email)
                    
                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .focused($focusedField, equals: .password)
                    
                    Button {
                        Task {
                            await authViewModel.login(email: email, password: password)
                        }
                    } label: {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)
                    
                    if let error = authViewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding()
                
                Spacer()
                
                // Demo credentials hint
                VStack(spacing: 4) {
                    Text("Demo Credentials:")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("broker@example.com / BrokerPass123!")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                .padding(.bottom)
            }
            .padding()
            .navigationBarHidden(true)
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}
```

---

## 3.11 Update App Entry Point

Update `RealEstateBrokerApp.swift`:

```swift
//
//  RealEstateBrokerApp.swift
//  RealEstateBroker
//
//  App entry point with Supabase integration
//

import SwiftUI

@main
struct RealEstateBrokerApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authViewModel.isAuthenticated {
                    LeadsListView()
                        .environmentObject(authViewModel)
                } else {
                    LoginView()
                        .environmentObject(authViewModel)
                }
            }
        }
    }
}
```

---

## 3.12 Update Configuration.swift with Your Credentials

**IMPORTANT**: Update `Utils/Configuration.swift` with your actual Supabase credentials:

```swift
enum Configuration {
    // MARK: - Supabase
    static let supabaseURL = "https://xxxxxxxxxxxxx.supabase.co" // REPLACE THIS
    static let supabaseAnonKey = "eyJhbGc..." // REPLACE THIS
    
    // MARK: - API
    static let apiBaseURL = "http://YOUR_COMPUTER_IP:3001/api" // REPLACE with your IP
    
    // MARK: - App Settings
    static let appVersion = "2.0.0"
}
```

To find your computer's IP:
- Mac: System Settings → Network → Your connection → IP Address
- Use this IP instead of `localhost` so iOS Simulator can access your backend

Example: `http://192.168.1.100:3001/api`

---

## 3.13 Build and Test

### Step 1: Clean Build
1. In Xcode: **Product** → **Clean Build Folder** (Cmd+Shift+K)
2. **Product** → **Build** (Cmd+B)

### Step 2: Fix Any Errors
Common issues:
- Missing imports: Add `import Supabase` at top of file
- Type mismatches: Check CodingKeys match Supabase column names
- Date parsing: Make sure dateDecodingStrategy is `.iso8601`

### Step 3: Run on Simulator
1. Select iPhone simulator (iPhone 15 Pro recommended)
2. Click **Run** (Cmd+R)
3. Wait for app to launch

### Step 4: Test Login
1. Enter credentials:
   - Email: `broker@example.com`
   - Password: `BrokerPass123!`
2. Tap "Sign In"
3. Should see leads list

### Step 5: Test Real-time Updates
**While app is running on simulator:**

1. Open your web browser
2. Go to your admin portal: `http://localhost:3000`
3. Login as admin
4. Upload a new Excel file with leads assigned to `broker@example.com`
5. **Watch the iOS Simulator** - the new leads should appear automatically within 1-2 seconds!

---

## 3.14 Testing Checklist

- [ ] App builds without errors
- [ ] Login works with broker credentials
- [ ] Leads list displays after login
- [ ] Can search leads
- [ ] Can filter by status
- [ ] Pull to refresh works
- [ ] Tapping a lead shows detail view
- [ ] Timeline milestones display correctly
- [ ] **REAL-TIME TEST**: Upload leads via web → appear in app instantly
- [ ] Logout works
- [ ] Re-login remembers session

---

## 3.15 Real-time Testing Guide

### Test Scenario 1: New Lead Assignment
1. iOS app open on simulator (logged in as broker)
2. Web browser: Admin uploads Excel with new lead
3. **Expected**: New lead appears in iOS app within 2 seconds (no refresh needed)

### Test Scenario 2: Lead Status Update
1. iOS app showing lead list
2. Web browser: Admin updates lead status to "Closed"
3. **Expected**: Status badge updates automatically in iOS app

### Test Scenario 3: Lead Deletion
1. iOS app showing lead
2. Web browser: Admin deletes the lead
3. **Expected**: Lead disappears from iOS app list

### Verify Real-time is Working:
Check Xcode console for these logs:
```
✅ Supabase client initialized
✅ Login successful: broker@example.com
✅ Fetched 10 leads
🔔 Subscribing to real-time updates for: broker@example.com
✅ Successfully subscribed to real-time updates
🆕 New lead inserted  ← This means real-time is working!
✅ Fetched 11 leads
```

---

## 3.16 Troubleshooting

### Issue: "Cannot connect to backend API"
**Solution**:
- Make sure backend server is running: `cd backend && npm start`
- Use your computer's IP, not `localhost`
- Check firewall isn't blocking port 3001

### Issue: "Real-time updates not working"
**Solution**:
1. Check Supabase dashboard → Database → Replication
2. Ensure `leads` table has Realtime enabled
3. Verify subscription logs in Xcode console
4. Make sure RLS policies allow broker to see their leads

### Issue: "Build failed - Cannot find Supabase"
**Solution**:
- File → Packages → Resolve Package Versions
- Clean build folder (Cmd+Shift+K)
- Rebuild (Cmd+B)

### Issue: "Dates showing incorrectly"
**Solution**:
- Make sure `dateDecodingStrategy = .iso8601` is set in JSONDecoder
- Check that backend returns ISO8601 formatted dates

### Issue: "RLS policy error"
**Solution**:
- Backend must use `service_role` key (not `anon` key)
- iOS app can use `anon` key (RLS handles permissions)
- Check JWT token contains `email` and `role` fields

---

## 3.17 Performance Optimization

### Tips for Production:

1. **Lazy Loading**: Load lead details only when needed
2. **Caching**: Use @Published var to cache fetched data
3. **Debouncing**: Add delay to search to reduce API calls
4. **Pagination**: Load leads in batches of 50
5. **Image Caching**: If you add photos, cache them locally

### Example: Add Pagination

```swift
// In LeadsViewModel.swift
@Published var currentPage = 0
let pageSize = 50

func fetchLeads() async {
    // Add pagination parameters
    let from = currentPage * pageSize
    let to = from + pageSize - 1
    
    // ... rest of fetch code
}
```

---

## Summary

✅ **You've now completed the full Supabase migration!**

### What You've Achieved:

1. ✅ Replaced JSON files with PostgreSQL database
2. ✅ Added real-time synchronization
3. ✅ Implemented secure authentication
4. ✅ Built production-ready iOS app
5. ✅ Automatic updates across all devices

### What Happens Now:

When admin uploads leads:
```
Admin uploads Excel → Backend inserts to Supabase → 
Supabase broadcasts change → iOS app receives update → 
UI refreshes automatically → Broker sees new lead instantly
```

**No polling. No manual refresh. Just real-time magic! ⚡**

---

## Next Steps

1. **Deploy Backend**: 
   - Deploy to Heroku, Railway, or Render
   - Update iOS app with production API URL

2. **App Store Submission**:
   - Add app icons
   - Create screenshots
   - Submit to TestFlight for beta testing

3. **Enhancements**:
   - Push notifications for new leads
   - Offline mode with local caching
   - Photo uploads for properties
   - E-signature integration

---

## Resources

- Supabase Swift Docs: https://github.com/supabase/supabase-swift
- Realtime Guide: https://supabase.com/docs/guides/realtime
- Swift Async/Await: https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html

---

Congratulations! Your Real Estate Broking App is now production-ready with real-time capabilities! 🎉

Questions? Need help? Just ask!

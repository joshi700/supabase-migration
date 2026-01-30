import SwiftUI

struct LeadsListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = LeadsViewModel()
    @State private var selectedLead: Lead?
    @State private var searchText = ""
    @State private var filterStatus: String = "All"
    
    let statusOptions = ["All", "New", "Processing", "Inspection", "Appraisal", "Clear to Close", "Closing", "Closed", "Cancelled"]
    
    var filteredLeads: [Lead] {
        var leads = viewModel.leads
        
        // Filter by search text
        if !searchText.isEmpty {
            leads = leads.filter { lead in
                lead.clientName.localizedCaseInsensitiveContains(searchText) ||
                lead.propertyAddress.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Filter by status
        if filterStatus != "All" {
            leads = leads.filter { $0.status.rawValue == filterStatus }
        }
        
        return leads
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search leads...", text: $searchText)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()
                
                // Status Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(statusOptions, id: \.self) { status in
                            Button(action: {
                                filterStatus = status
                            }) {
                                Text(status)
                                    .font(.subheadline)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(filterStatus == status ? Color.blue : Color(.systemGray6))
                                    .foregroundColor(filterStatus == status ? .white : .primary)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom)
                
                // Leads List
                if viewModel.isLoading {
                    ProgressView("Loading leads...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                        Button("Retry") {
                            Task {
                                if let token = KeychainHelper.shared.getToken() {
                                    await viewModel.fetchLeads(token: token)
                                }
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else if filteredLeads.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "tray")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        Text("No leads found")
                            .foregroundColor(.secondary)
                        
                        if !searchText.isEmpty || filterStatus != "All" {
                            Text("Try adjusting your filters")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else if let user = authViewModel.currentUser {
                            VStack(spacing: 8) {
                                Text("Logged in as:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(user.email)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                Text("Contact your admin to assign leads")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(filteredLeads) { lead in
                        LeadRowView(lead: lead)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedLead = lead
                            }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        if let token = KeychainHelper.shared.getToken() {
                            await viewModel.fetchLeads(token: token)
                        }
                    }
                }
            }
            .navigationTitle("My Leads")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Menu {
                        if let user = authViewModel.currentUser {
                            Text(user.name)
                            Text(user.email)
                            Divider()
                            Text("Role: \(user.role.rawValue.capitalized)")
                        }
                    } label: {
                        if let user = authViewModel.currentUser {
                            HStack(spacing: 6) {
                                // User initial circle
                                Circle()
                                    .fill(Color.blue.opacity(0.2))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Text(String(user.name.prefix(1)))
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.blue)
                                    )
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(user.name)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .lineLimit(1)
                                    Text(user.email.components(separatedBy: "@").first ?? "")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        Button(action: {
                            Task {
                                if let token = KeychainHelper.shared.getToken() {
                                    await viewModel.fetchLeads(token: token)
                                }
                            }
                        }) {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(viewModel.isLoading)
                        
                        Button(action: {
                            authViewModel.logout()
                        }) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .sheet(item: $selectedLead) { lead in
                LeadDetailView(lead: lead)
            }
        }
        .task {
            // Load leads when view appears
            if let token = KeychainHelper.shared.getToken() {
                await viewModel.fetchLeads(token: token)
                
                // Subscribe to real-time updates if user email is available
                if let email = authViewModel.currentUser?.email {
                    viewModel.subscribeToRealtimeUpdates(brokerEmail: email)
                }
            }
        }
    }
}

struct LeadRowView: View {
    let lead: Lead
    
    var statusColor: Color {
        switch lead.status {
        case .new: return .blue
        case .processing: return .orange
        case .inspection, .appraisal: return .purple
        case .clearToClose: return .green
        case .closing: return .teal
        case .closed: return .gray
        case .cancelled: return .red
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(lead.clientName)
                    .font(.headline)
                Spacer()
                Text(lead.status.rawValue)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.2))
                    .foregroundColor(statusColor)
                    .cornerRadius(8)
            }
            
            Text(lead.propertyAddress)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            HStack {
                Text("Last updated: \(lead.lastUpdated, style: .date)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    LeadsListView()
        .environmentObject(AuthViewModel())
}

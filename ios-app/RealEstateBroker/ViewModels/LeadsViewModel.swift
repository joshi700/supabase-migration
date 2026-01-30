import Foundation
import Combine

@MainActor
class LeadsViewModel: ObservableObject {
    @Published var leads: [Lead] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    func fetchLeads(token: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            print("🔵 Starting to fetch leads...")
            leads = try await APIService.shared.fetchLeads(token: token)
            print("✅ Successfully fetched \(leads.count) leads")
        } catch let decodingError as DecodingError {
            print("❌ Decoding Error: \(decodingError)")
            switch decodingError {
            case .dataCorrupted(let context):
                print("Data corrupted: \(context.debugDescription)")
                print("Coding path: \(context.codingPath)")
                errorMessage = "Failed to decode leads data: \(context.debugDescription)"
            case .keyNotFound(let key, let context):
                print("Key '\(key.stringValue)' not found: \(context.debugDescription)")
                print("Coding path: \(context.codingPath)")
                errorMessage = "Missing key '\(key.stringValue)' in leads data"
            case .typeMismatch(let type, let context):
                print("Type mismatch for type \(type): \(context.debugDescription)")
                print("Coding path: \(context.codingPath)")
                errorMessage = "Type mismatch in leads data: \(context.debugDescription)"
            case .valueNotFound(let type, let context):
                print("Value not found for type \(type): \(context.debugDescription)")
                print("Coding path: \(context.codingPath)")
                errorMessage = "Missing value in leads data: \(context.debugDescription)"
            @unknown default:
                print("Unknown decoding error: \(decodingError)")
                errorMessage = "Unknown decoding error"
            }
        } catch {
            print("❌ Error fetching leads: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // TODO: Add Supabase real-time subscriptions later
    // For now, the app will work without real-time updates
    func subscribeToRealtimeUpdates(brokerEmail: String) {
        print("ℹ️ Real-time updates not enabled yet")
        // Will add Supabase package and implement this later
    }
}

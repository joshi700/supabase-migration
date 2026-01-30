import SwiftUI

struct StatusBadge: View {
    let status: LeadStatus
    
    var statusColor: Color {
        switch status {
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
        Text(status.rawValue)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(8)
    }
}

struct LeadDetailView: View {
    let lead: Lead
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header Card
                headerCard
                
                // Timeline View
                TimelineView(lead: lead)
                
                // Property Details
                detailsSection
            }
            .padding()
        }
        .navigationTitle("Lead Details")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text(lead.clientName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(lead.leadID)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                StatusBadge(status: lead.status)
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 8) {
                InfoRow(icon: "mappin.circle.fill", text: lead.propertyAddress)
                InfoRow(icon: "envelope.fill", text: lead.brokerEmail)
                InfoRow(icon: "clock.fill", text: "Updated: \(lead.lastUpdated.formatted())")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Key Dates")
                .font(.title3)
                .fontWeight(.bold)
            
            VStack(spacing: 12) {
                DateInfoCard(
                    title: "Expected Close Date",
                    expectedDate: lead.expectedCloseDate,
                    actualDate: lead.actualCloseDate
                )
                
                DateInfoCard(
                    title: "Clear to Close",
                    expectedDate: lead.expectedClearToCloseDate,
                    actualDate: lead.actualClearToCloseDate
                )
                
                DateInfoCard(
                    title: "Appraisal Complete",
                    expectedDate: lead.expectedAppraisalCompleteDate,
                    actualDate: lead.actualAppraisalCompleteDate
                )
                
                DateInfoCard(
                    title: "Inspection Complete",
                    expectedDate: lead.expectedInspectionCompleteDate,
                    actualDate: lead.actualInspectionCompleteDate
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct InfoRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(text)
                .font(.subheadline)
        }
    }
}

struct DateInfoCard: View {
    let title: String
    let expectedDate: Date?
    let actualDate: Date?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Expected")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let expected = expectedDate {
                        Text(expected.formatted(date: .abbreviated, time: .omitted))
                            .font(.subheadline)
                    } else {
                        Text("Not set")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Actual")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let actual = actualDate {
                        Text(actual.formatted(date: .abbreviated, time: .omitted))
                            .font(.subheadline)
                            .foregroundColor(.green)
                    } else {
                        Text("Pending")
                            .font(.subheadline)
                            .foregroundColor(.orange)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

#Preview {
    NavigationView {
        LeadDetailView(lead: previewLead)
    }
}

// Preview helper
private let previewLead: Lead = {
    let jsonString = """
    {
        "_id": "preview-1",
        "Lead ID": "L001",
        "Broker Email": "broker@example.com",
        "Client Name": "John Doe",
        "Property Address": "123 Main St, City, State",
        "Status": "Processing",
        "Last Updated": "2025-01-07T12:00:00Z",
        "Expected Offer Accept Date": "2025-01-02T00:00:00Z",
        "Expected Title Date": "2025-01-09T00:00:00Z",
        "Expected Inspection Order Date": "2025-01-12T00:00:00Z",
        "Expected Inspection Complete Date": "2025-01-16T00:00:00Z",
        "Expected Appraisal Order Date": "2025-01-17T00:00:00Z",
        "Expected Appraisal Complete Date": "2025-01-23T00:00:00Z",
        "Expected Clear to Close Date": "2025-01-27T00:00:00Z",
        "Expected Closing Scheduled Date": "2025-01-30T00:00:00Z",
        "Expected Close Date": "2025-02-01T00:00:00Z",
        "Actual Offer Accept Date": "2025-01-02T00:00:00Z",
        "Actual Title Date": "",
        "Actual Inspection Order Date": "",
        "Actual Inspection Complete Date": "",
        "Actual Appraisal Order Date": "",
        "Actual Appraisal Complete Date": "",
        "Actual Clear to Close Date": "",
        "Actual Closing Scheduled Date": "",
        "Actual Close Date": ""
    }
    """
    let data = jsonString.data(using: .utf8)!
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return try! decoder.decode(Lead.self, from: data)
}()

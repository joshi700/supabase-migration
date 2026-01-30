import Foundation

struct Lead: Identifiable, Codable {
    let id: String
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
    
    // Ignore fields from backend that we don't need
    private enum CodingKeys: String, CodingKey {
        case id
        case leadID = "lead_id"
        case brokerEmail = "broker_email"
        case clientName = "client_name"
        case propertyAddress = "property_address"
        case status
        case lastUpdated = "last_updated"
        case expectedOfferAcceptDate = "expected_offer_accept_date"
        case expectedTitleDate = "expected_title_date"
        case expectedInspectionOrderDate = "expected_inspection_order_date"
        case expectedInspectionCompleteDate = "expected_inspection_complete_date"
        case expectedAppraisalOrderDate = "expected_appraisal_order_date"
        case expectedAppraisalCompleteDate = "expected_appraisal_complete_date"
        case expectedClearToCloseDate = "expected_clear_to_close_date"
        case expectedClosingScheduledDate = "expected_closing_scheduled_date"
        case expectedCloseDate = "expected_close_date"
        case actualOfferAcceptDate = "actual_offer_accept_date"
        case actualTitleDate = "actual_title_date"
        case actualInspectionOrderDate = "actual_inspection_order_date"
        case actualInspectionCompleteDate = "actual_inspection_complete_date"
        case actualAppraisalOrderDate = "actual_appraisal_order_date"
        case actualAppraisalCompleteDate = "actual_appraisal_complete_date"
        case actualClearToCloseDate = "actual_clear_to_close_date"
        case actualClosingScheduledDate = "actual_closing_scheduled_date"
        case actualCloseDate = "actual_close_date"
        // Omit created_at - we don't need it
    }
}

enum LeadStatus: String, Codable {
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
}

// Timeline milestone structure - NOT Codable, just a simple struct
struct TimelineMilestone: Identifiable {
    let id = UUID()
    let title: String
    let expectedDate: Date?
    let actualDate: Date?
    let isCompleted: Bool
    
    var displayDate: Date? {
        actualDate ?? expectedDate
    }
    
    // Add explicit initializer
    init(title: String, expectedDate: Date?, actualDate: Date?, isCompleted: Bool) {
        self.title = title
        self.expectedDate = expectedDate
        self.actualDate = actualDate
        self.isCompleted = isCompleted
    }
}

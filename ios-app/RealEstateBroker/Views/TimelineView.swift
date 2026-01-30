import SwiftUI

struct TimelineView: View {
    let lead: Lead
    
    var milestones: [TimelineMilestone] {
        [
            TimelineMilestone(
                title: "Offer Accepted",
                expectedDate: lead.expectedOfferAcceptDate,
                actualDate: lead.actualOfferAcceptDate,
                isCompleted: lead.actualOfferAcceptDate != nil
            ),
            TimelineMilestone(
                title: "Title Ordered",
                expectedDate: lead.expectedTitleDate,
                actualDate: lead.actualTitleDate,
                isCompleted: lead.actualTitleDate != nil
            ),
            TimelineMilestone(
                title: "Inspection Ordered",
                expectedDate: lead.expectedInspectionOrderDate,
                actualDate: lead.actualInspectionOrderDate,
                isCompleted: lead.actualInspectionOrderDate != nil
            ),
            TimelineMilestone(
                title: "Inspection Complete",
                expectedDate: lead.expectedInspectionCompleteDate,
                actualDate: lead.actualInspectionCompleteDate,
                isCompleted: lead.actualInspectionCompleteDate != nil
            ),
            TimelineMilestone(
                title: "Appraisal Ordered",
                expectedDate: lead.expectedAppraisalOrderDate,
                actualDate: lead.actualAppraisalOrderDate,
                isCompleted: lead.actualAppraisalOrderDate != nil
            ),
            TimelineMilestone(
                title: "Appraisal Complete",
                expectedDate: lead.expectedAppraisalCompleteDate,
                actualDate: lead.actualAppraisalCompleteDate,
                isCompleted: lead.actualAppraisalCompleteDate != nil
            ),
            TimelineMilestone(
                title: "Clear to Close",
                expectedDate: lead.expectedClearToCloseDate,
                actualDate: lead.actualClearToCloseDate,
                isCompleted: lead.actualClearToCloseDate != nil
            ),
            TimelineMilestone(
                title: "Closing Scheduled",
                expectedDate: lead.expectedClosingScheduledDate,
                actualDate: lead.actualClosingScheduledDate,
                isCompleted: lead.actualClosingScheduledDate != nil
            ),
            TimelineMilestone(
                title: "Deal Closed",
                expectedDate: lead.expectedCloseDate,
                actualDate: lead.actualCloseDate,
                isCompleted: lead.actualCloseDate != nil
            )
        ]
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Transaction Timeline")
                .font(.title3)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(Array(milestones.enumerated()), id: \.element.id) { index, milestone in
                        TimelineMilestoneView(
                            milestone: milestone,
                            isLast: index == milestones.count - 1
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct TimelineMilestoneView: View {
    let milestone: TimelineMilestone
    let isLast: Bool
    
    var body: some View {
        HStack(spacing: 0) {
            VStack(spacing: 8) {
                // Circle indicator
                ZStack {
                    Circle()
                        .fill(milestone.isCompleted ? Color.green : Color.gray.opacity(0.3))
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: milestone.isCompleted ? "checkmark" : "circle")
                        .foregroundColor(milestone.isCompleted ? .white : .gray)
                        .font(.system(size: 16, weight: .bold))
                }
                
                // Milestone info
                VStack(alignment: .center, spacing: 4) {
                    Text(milestone.title)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                        .frame(width: 100)
                    
                    if let date = milestone.displayDate {
                        Text(date.formatted(date: .abbreviated, time: .omitted))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Not set")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    if milestone.isCompleted {
                        Text("✓ Completed")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }
            
            if !isLast {
                Rectangle()
                    .fill(milestone.isCompleted ? Color.green : Color.gray.opacity(0.3))
                    .frame(width: 40, height: 2)
                    .padding(.bottom, 70)
            }
        }
    }
}

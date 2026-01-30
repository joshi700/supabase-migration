import Foundation

extension Date {
    func toString(format: String = "MMM d, yyyy") -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = format
        return formatter.string(from: self)
    }
    
    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
    
    var isTomorrow: Bool {
        Calendar.current.isDateInTomorrow(self)
    }
    
    var isPast: Bool {
        self < Date()
    }
    
    func daysUntil() -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: Date(), to: self)
        return components.day ?? 0
    }
    
    func relativeString() -> String {
        let days = daysUntil()
        
        if isToday {
            return "Today"
        } else if isTomorrow {
            return "Tomorrow"
        } else if days < 0 {
            return "\(abs(days)) days ago"
        } else if days == 0 {
            return "Today"
        } else {
            return "In \(days) days"
        }
    }
}

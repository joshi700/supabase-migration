//
//  Configuration.swift
//  RealEstateBroker
//

import Foundation

enum Configuration {
    // MARK: - Supabase
    // TODO: Replace with your actual Supabase credentials
    // Get these from: https://app.supabase.com → Your Project → Settings → API
    static let supabaseURL = "https://pnryfguzuibcyrnumrhc.supabase.co"
    static let supabaseAnonKey = "sb_publishable_OghsmolGqRpEl1CmVmNm-A_OonxS6Wt"
    
    // MARK: - API
    // TODO: Replace YOUR_COMPUTER_IP with your actual IP address
    // Find your IP: Mac → System Settings → Network → Your connection
    // Example: "http://192.168.1.100:3001/api"
    static let apiBaseURL = "http://localhost:3001/api"
    
    // MARK: - App Settings
    static let appVersion = "3.0.0"
}

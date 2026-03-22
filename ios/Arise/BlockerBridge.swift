import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

/**
 * BlockerBridge.swift — iOS FamilyControls implementation.
 * Requires: com.apple.developer.family-controls entitlement.
 * Apply at: https://developer.apple.com/contact/request/family-controls-distribution
 */
@objc(BlockerBridge)
class BlockerBridge: NSObject {
    private let store = ManagedSettingsStore()

    @objc func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                resolve(true)
            } catch { reject("AUTH_ERROR", error.localizedDescription, error) }
        }
    }

    @objc func startFamilyControlsSession(_ durationSecs: Double,
                                           encodedSelection: String,
                                           resolver resolve: @escaping RCTPromiseResolveBlock,
                                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let data = Data(base64Encoded: encodedSelection),
              let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            reject("DECODE_ERROR", "Could not decode app selection", nil); return
        }
        store.shield.applications = selection.applicationTokens
        resolve(true)
    }

    @objc func stopFamilyControlsSession(_ resolve: @escaping RCTPromiseResolveBlock,
                                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        resolve(true)
    }
}

extension DeviceActivityName {
    static let arise = Self("com.arise.session")
}


import { getTileOrder, ParticipantPresence } from '../lib/gridLayout';

// Mock Data
const participants: ParticipantPresence[] = [
  { user_id: '1', name: 'User 1', role: 'participant', presence: 'connected', joined_at: '2023-01-01T10:05:00Z', is_video_on: true, is_audio_on: true, is_speaking: false, is_presenting: false, is_hand_raised: false, avatar_color: 'red' }, // Normal, late join
  { user_id: '2', name: 'User 2', role: 'host', presence: 'connected', joined_at: '2023-01-01T10:00:00Z', is_video_on: true, is_audio_on: true, is_speaking: false, is_presenting: false, is_hand_raised: false, avatar_color: 'blue' }, // Host
  { user_id: '3', name: 'User 3', role: 'participant', presence: 'connected', joined_at: '2023-01-01T10:01:00Z', is_video_on: true, is_audio_on: true, is_speaking: true, is_presenting: false, is_hand_raised: false, avatar_color: 'green' }, // Speaker
  { user_id: '4', name: 'User 4', role: 'participant', presence: 'connected', joined_at: '2023-01-01T10:02:00Z', is_video_on: true, is_audio_on: true, is_speaking: false, is_presenting: true, is_hand_raised: false, avatar_color: 'yellow' }, // Presenter
  { user_id: '5', name: 'User 5', role: 'participant', presence: 'connected', joined_at: '2023-01-01T10:03:00Z', is_video_on: true, is_audio_on: true, is_speaking: false, is_presenting: false, is_hand_raised: false, is_spotlighted: true, avatar_color: 'purple' }, // Spotlight
  { user_id: '6', name: 'User 6', role: 'co-host', presence: 'connected', joined_at: '2023-01-01T10:04:00Z', is_video_on: true, is_audio_on: true, is_speaking: false, is_presenting: false, is_hand_raised: false, avatar_color: 'orange' }, // Co-host
];

console.log("Running Grid Layout Sorting Test...");

const sorted = getTileOrder(participants);

// Expected Order:
// 1. Spotlight (User 5)
// 2. Presenter (User 4)
// 3. Host (User 2)
// 4. Active Speaker (User 3) - Note: Co-host logic might interfere? Wait.
//    Logic: Spotlight -> Presenter -> Host -> Active Speaker -> Join Order
//    Wait, Co-host was removed in my edit? 
//    Let's check the code I wrote in gridLayout.ts.
//    I replaced "Co-host" block with "Active Speaker".
//    So Co-host is now just "Others" based on Join Order?
//    Let's verify.

const expectedOrderIds = ['5', '4', '2', '3', '6', '1'];
// 5 (Spotlight)
// 4 (Presenter)
// 2 (Host)
// 3 (Speaker) - Priority 4
// 6 (Co-host) - No specific priority in new code, matches Join Order (10:04) vs User 1 (10:05). 
//               Wait, User 6 joined at 10:04. User 1 joined at 10:05.
//               So User 6 comes before User 1.
//               Correct.

const actualOrderIds = sorted.map(p => p.user_id);

console.log("Expected:", expectedOrderIds.join(', '));
console.log("Actual:  ", actualOrderIds.join(', '));

const success = JSON.stringify(expectedOrderIds) === JSON.stringify(actualOrderIds);

if (success) {
    console.log("✅ TEST PASSED: Sorting logic is correct.");
} else {
    console.error("❌ TEST FAILED: Sorting logic mismatch.");
    process.exit(1);
}

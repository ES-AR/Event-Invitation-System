# Use Case Descriptions

## 1. Register for Event

| Field | Description |
|---|---|
| **Use Case Name** | Register for Event |
| **Actor** | Guest |
| **Description** | A guest registers for an event by providing their details and uploading a photo. |
| **Preconditions** | 1. The event exists and is published.<br>2. Registration is open (not expired, quota not full or overflow enabled).<br>3. Guest has not already registered with the same email. |
| **Post-conditions** | 1. A new registration record is created in the database.<br>2. The guest is assigned a slot (Main or Overflow) based on availability.<br>3. If approved immediately (or overflow), a confirmation email is sent.<br>4. Guest photo is saved to the server. |
| **Alternate Flows** | **A1: Quota Full:** If Main slots are full but Overflow is available, Guest is placed in Overflow.<br>**A2: Event Closed:** If event is closed, registration is denied.<br>**A3: Duplicate:** If email exists, system returns an error. |

## 2. Approve Registration

| Field | Description |
|---|---|
| **Use Case Name** | Approve Registration |
| **Actor** | Admin |
| **Description** | An administrator manually approves a pending registration. |
| **Preconditions** | 1. Admin is logged in.<br>2. A registration exists with "Pending" status. |
| **Post-conditions** | 1. Registration status changes to "Approved".<br>2. An automated email with the PDF ticket is sent to the guest.<br>3. Status history log is updated. |

## 3. Check-in Attendee

| Field | Description |
|---|---|
| **Use Case Name** | Check-in Attendee |
| **Actor** | Check-in Staff / Admin |
| **Description** | Staff verifies an attendee's identity and marks them as present. |
| **Preconditions** | 1. Staff is authorized (has check-in token).<br>2. Attendee exists in the system. |
| **Post-conditions** | 1. Attendee is marked as "Checked In".<br>2. Timestamp of check-in is recorded. |
| **Alternate Flows** | **A1: Already Checked In:** System notifies staff that the attendee is already checked in. |

## 4. Bulk Approve Attendees

| Field | Description |
|---|---|
| **Use Case Name** | Bulk Approve Attendees |
| **Actor** | Admin |
| **Description** | Admin selects multiple pending registrations and approves them in one action. |
| **Preconditions** | 1. Admin is logged in.<br>2. Multiple registrations are selected. |
| **Post-conditions** | 1. All selected registrations are set to "Approved".<br>2. Emails are triggered for all approved attendees.<br>3. A summary of successful/failed emails is returned. |

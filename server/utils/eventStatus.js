export async function applyAutoClose(event) {
  if (
    !event ||
    !event.autoCloseOnExpire ||
    !event.registrationClosesAt ||
    !event.isRegistrationOpen
  ) {
    return event;
  }

  const now = new Date();
  const closeDate = new Date(event.registrationClosesAt);

  if (now >= closeDate) {
    event.isRegistrationOpen = false;
    if (!event.closeReason) {
      event.closeReason = "Registration automatically closed.";
    }
    await event.save({ validateBeforeSave: false });
  }

  return event;
}

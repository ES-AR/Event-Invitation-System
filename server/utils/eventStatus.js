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

export async function applyQuotaClose(event, counts = {}) {
  if (!event || !event.isRegistrationOpen) {
    return event;
  }

  const mainCapacity = Math.max(event.maxMainSlots || 0, 0);
  const overflowCapacity = Math.max(event.maxOverflowSlots || 0, 0);
  const mainUsed = Math.max(counts.mainUsed || 0, 0);
  const overflowUsed = Math.max(counts.overflowUsed || 0, 0);

  if (mainCapacity <= 0 && overflowCapacity <= 0) {
    return event;
  }

  const mainFull = mainCapacity > 0 && mainUsed >= mainCapacity;
  const overflowEnabled = overflowCapacity > 0;
  const overflowFull = overflowEnabled ? overflowUsed >= overflowCapacity : true;

  if (mainFull && overflowFull) {
    event.isRegistrationOpen = false;
    if (!event.closeReason) {
      event.closeReason = "All slots are filled.";
    }
    await event.save({ validateBeforeSave: false });
  }

  return event;
}

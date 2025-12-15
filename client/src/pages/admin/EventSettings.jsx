import { useEffect, useState } from "react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { getEventSettings, updateEventSettings } from "../../services/event.service";

const numericFields = ["maxMainSlots", "maxOverflowSlots"];

export default function EventSettings() {
  const [eventData, setEventData] = useState(null);
  const [status, setStatus] = useState({ loading: true, saving: false, message: "", error: "" });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await getEventSettings();
        setEventData(response.event);
        setStatus((prev) => ({ ...prev, loading: false, error: "" }));
      } catch (err) {
        setStatus((prev) => ({ ...prev, loading: false, error: err.message || "Failed to load settings" }));
      }
    }

    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (numericFields.includes(name)) {
      nextValue = Number(nextValue) || 0;
    }

    setEventData((prev) => ({ ...prev, [name]: nextValue }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setStatus((prev) => ({ ...prev, saving: true, message: "", error: "" }));
      const response = await updateEventSettings(eventData);
      setEventData(response.event);
      setStatus((prev) => ({ ...prev, saving: false, message: response.message }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, saving: false, error: err.message || "Failed to save settings" }));
    }
  }

  if (status.loading || !eventData) {
    return <p className="text-sm text-gray-600">Loading event settings...</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold">Event Settings</h1>
        <p className="text-sm text-gray-600">Update public-facing details and slot limits.</p>
      </header>

      {status.error && <p className="text-sm text-red-600">{status.error}</p>}
      {status.message && <p className="text-sm text-green-600">{status.message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" name="title" value={eventData.title} onChange={handleChange} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            className="w-full min-h-[6rem] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <Input label="Location" name="location" value={eventData.location} onChange={handleChange} />
        <Input label="Banner URL" name="bannerUrl" value={eventData.bannerUrl} onChange={handleChange} />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Main Slot Capacity"
            name="maxMainSlots"
            type="number"
            value={eventData.maxMainSlots}
            onChange={handleChange}
            required
          />
          <Input
            label="Overflow Slot Capacity"
            name="maxOverflowSlots"
            type="number"
            value={eventData.maxOverflowSlots}
            onChange={handleChange}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requiresApproval"
            checked={eventData.requiresApproval}
            onChange={handleChange}
          />
          Require admin approval before confirming spots
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="allowWalkIns"
            checked={eventData.allowWalkIns}
            onChange={handleChange}
          />
          Allow walk-in check-ins without registration
        </label>

        <Button type="submit" loading={status.saving} variant="primary">
          Save Settings
        </Button>
      </form>
    </div>
  );
}

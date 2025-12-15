import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import {
  getAttendees,
  approveAttendee,
  deleteAttendee,
  sendCheckInEmail,
} from "../../services/registration.service";

const STATUS_FILTERS = ["all", "pending", "approved", "checked-in"];

export default function Attendees() {
  const [attendees, setAttendees] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    loadAttendees();
  }, []);

  const filteredAttendees = useMemo(() => {
    if (filter === "all") return attendees;
    return attendees.filter((attendee) => attendee.status === filter);
  }, [attendees, filter]);

  async function loadAttendees() {
    try {
      setLoading(true);
      const response = await getAttendees();
      setAttendees(response.attendees || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load attendees");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      setActionId(id);
      const response = await approveAttendee(id);
      setToast(response.message);
      await loadAttendees();
    } catch (err) {
      setError(err.message || "Approval failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id) {
    try {
      setActionId(id);
      const response = await deleteAttendee(id);
      setToast(response.message);
      await loadAttendees();
    } catch (err) {
      setError(err.message || "Removal failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleSendLink(id) {
    try {
      setActionId(id);
      const response = await sendCheckInEmail(id);
      setToast(response.checkInUrl || response.message);
    } catch (err) {
      setError(err.message || "Unable to generate link");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendees</h1>
          <p className="text-sm text-gray-600">Approve or remove registrations.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm border ${
                filter === status ? "bg-black text-white" : "bg-white text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {toast && <p className="text-green-600 text-sm">{toast}</p>}

      {loading ? (
        <p className="text-sm text-gray-600">Loading attendees...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Slot</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendees.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                    No attendees found for this filter.
                  </td>
                </tr>
              )}

              {filteredAttendees.map((attendee) => (
                <tr key={attendee._id} className="border-t">
                  <td className="px-4 py-2 font-medium">{attendee.fullName}</td>
                  <td className="px-4 py-2">{attendee.email}</td>
                  <td className="px-4 py-2 capitalize">{attendee.slotType}</td>
                  <td className="px-4 py-2 capitalize">{attendee.status}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      {attendee.status === "pending" && (
                        <Button
                          variant="primary"
                          loading={actionId === attendee._id}
                          onClick={() => handleApprove(attendee._id)}
                        >
                          Approve
                        </Button>
                      )}

                      {attendee.status === "approved" && (
                        <Button
                          variant="outline"
                          loading={actionId === attendee._id}
                          onClick={() => handleSendLink(attendee._id)}
                        >
                          Send Link
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        loading={actionId === attendee._id}
                        onClick={() => handleDelete(attendee._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

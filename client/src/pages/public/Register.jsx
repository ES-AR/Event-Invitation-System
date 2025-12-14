// client/src/pages/public/Register.jsx
import React, { useEffect, useState } from "react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import EventBanner from "../../components/public/EventBanner";


import { getEventSettings } from "../../services/event.service";
import { registerAttendee } from "../../services/registration.service";

export default function Register() {
  const [eventData, setEventData] = useState(null);
//   const [captcha, setCaptcha] = useState({ id: "", question: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    note: "",
    // captchaAnswer: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });

  // Fetch event and captcha on load
  useEffect(() => {
    loadEvent();
    // loadCaptcha();
  }, []);

  const loadEvent = async () => {
    const data = await getEventSettings();
    setEventData(data);
  };

//   const loadCaptcha = async () => {
//     const cap = await getCaptcha();
//     setCaptcha(cap);
//   };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus({ loading: true, message: "", error: "" });

    try {
      const res = await registerAttendee({
        ...form,
        // captchaId: captcha.id,
      });

      setStatus({ loading: false, message: res.message, error: "" });
    } catch (err) {
      setStatus({
        loading: false,
        message: "",
        error: err?.message || "Registration failed",
      });

    //   loadCaptcha(); // refresh captcha
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center md:px-10">
      <div className="w-full max-w-5xl flex flex-col md:flex-row py-10 gap-10">

        {/* LEFT SIDE — Banner & info */}
        <div className="md:w-1/2 border-r pr-6">
          <EventBanner event={eventData?.event} />
        </div>

        {/* RIGHT SIDE — Registration Form */}
        <div className="md:w-1/2 flex flex-col gap-6 px-4">
          <h2 className="text-xl font-semibold">Register for the Event</h2>

          {eventData?.isClosed ? (
            <p className="text-red-600 font-medium">
              Registration is closed.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />

              <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} required />

              <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />

              <Input label="Organization or Affiliation" name="organization" value={form.organization} onChange={handleChange} />

              <Input label="Note (Optional)" name="note" value={form.note} onChange={handleChange} />

              {/* CAPTCHA */}
              {/* <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Security Check
                </label>
                <p className="text-gray-600 text-sm">{captcha.question}</p>
                <Input
                  name="captchaAnswer"
                  placeholder="Enter answer"
                  value={form.captchaAnswer}
                  onChange={handleChange}
                  required
                />
              </div> */}

              {status.error && (
                <p className="text-red-600 text-sm">{status.error}</p>
              )}

              {status.message && (
                <p className="text-green-600 text-sm">{status.message}</p>
              )}

              <Button
                type="submit"
                loading={status.loading}
                variant="primary"
                className="w-full"
              >
                Submit Registration
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

// =============================
// CONFIG
// =============================
const BackendUrl = "http://localhost:5000";

// =============================
// 1) GET ALL FORM FIELDS
// =============================
function getConsultType() {
  return (
    document.querySelector('input[name="consultType"]:checked')?.value || ""
  );
}

function getConsultModes() {
  return [
    ...document.querySelectorAll(
      '#consultModes input[type="checkbox"]:checked'
    ),
  ].map((c) => c.parentElement.innerText.trim());
}

function getSchedule() {
  return {
    date: document.getElementById("selectedDate")?.value || "",
    time:
      document.querySelector('input[name="time"]:checked')?.nextElementSibling
        ?.innerText || "",
  };
}

function getPersonalDetails() {
  return {
    fullName: document.getElementById("fullName")?.value || "",
    gender:
      document
        .querySelector('input[name="gender"]:checked')
        ?.nextSibling?.textContent.trim() || "",
    dob: document.getElementById("dob")?.value || "",
    tob: document.getElementById("tob")?.value || "",
  };
}

function getBirthPlace() {
  return {
    country: document.getElementById("country")?.value || "",
    state: document.getElementById("state")?.value || "",
    city: document.getElementById("city")?.value || "",
    pincode: document.getElementById("pincode")?.value || "",
  };
}

function getContactDetails() {
  return {
    phone:
      (document.getElementById("selectedDial")?.innerText || "") +
      (document.getElementById("phoneNumber")?.value || ""),
    email: document.querySelector('input[type="email"]')?.value || "",
  };
}

function getConsultationPreferences() {
  return [
    ...document.querySelectorAll(
      '#consultationPreferences input[type="checkbox"]:checked'
    ),
  ].map((c) => c.parentElement.innerText.trim());
}

function getOtherPreferences() {
  return document.getElementById("otherPreferences")?.value || "";
}

function getConsultedBefore() {
  return (
    document
      .querySelector('input[name="consulted"]:checked')
      ?.nextSibling?.textContent.trim() || ""
  );
}

function getSpecificConcerns() {
  return document.getElementById("specificConcerns")?.value || "";
}

function getRemediesPreference() {
  return (
    document
      .querySelector('input[name="remedies"]:checked')
      ?.nextSibling?.textContent.trim() || ""
  );
}

// =============================
// 2) PACKAGE ALL VALUES
// =============================
function buildConsultationPayload(paymentAmount) {
  return {
    consultType: getConsultType(),
    consultModes: getConsultModes(),
    schedule: getSchedule(),
    personal: getPersonalDetails(),
    birthPlace: getBirthPlace(),
    contact: getContactDetails(),
    preferences: {
      topics: getConsultationPreferences(),
      others: getOtherPreferences(),
    },
    consultedBefore: getConsultedBefore(),
    specificConcerns: getSpecificConcerns(),
    remedies: getRemediesPreference(),
    paymentAmount: paymentAmount,
  };
}

// =============================
// 3) HANDLE PAY BUTTONS
// =============================
async function handlePay(amount) {
  console.log("💰 handlePay called with amount:", amount);

  const payload = buildConsultationPayload(amount);
  console.log("📦 Payload built:", payload);

  try {
    // 1) Book consultation - ONLY creates Razorpay order now
    const res = await fetch(`${BackendUrl}/api/v1/client/consultation/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("📥 Response from backend:", data);

    if (!data.success) {
      alert("Failed to create order!");
      return;
    }

    // Store formData temporarily
    window.tempConsultationForm = payload;

    // 2) Razorpay popup
    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "Astrology Consultation",
      description: "Booking Fee",
      order_id: data.orderId,

      handler: async function (response) {
        console.log("🔥 Payment completed! Verifying...");

        const verifyRes = await fetch(
          `${BackendUrl}/api/v1/client/consultation/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,

              formData: window.tempConsultationForm, // send full form
            }),
          }
        );

        const verifyData = await verifyRes.json();
        console.log("🔍 Verification response:", verifyData);

        if (verifyData.success) {
          alert("🎉 Payment successful!");
        } else {
          alert("❌ Payment verification failed!");
        }
      },
    };

    const razorpayObject = new Razorpay(options);
    razorpayObject.open();
  } catch (err) {
    console.error("⚠️ Error in handlePay:", err);
  }
}

// =============================
// 4) ADD EVENT LISTENERS
// =============================
document.getElementById("payButton").addEventListener("click", (e) => {
  e.preventDefault();
  handlePay(500);
});

document.getElementById("payButton1").addEventListener("click", (e) => {
  e.preventDefault();
  handlePay(1800);
});

// =============================
// CONFIG
// =============================
const API_URL = "http://localhost:5000/api/v1/available-slots";
const BackendUrl = "http://localhost:5000";

// =============================
// STATE MANAGEMENT
// =============================
let selectedSlot = null;
let availableSlotsByDate = {};
let allCountries = [];
let cityData = [
  { city: "Bishalgarh", pincode: "799102", state: "Tripura" },
  { city: "Agartala", pincode: "799001", state: "Tripura" },
  { city: "Dharmanagar", pincode: "799250", state: "Tripura" },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date();
maxDate.setMonth(today.getMonth() + 3);

let currentDate = new Date(today.getFullYear(), today.getMonth());

// =============================
// CALENDAR FUNCTIONS
// =============================
async function fetchAvailableSlots() {
  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    console.log(json);

    availableSlotsByDate = {};
    json.data.forEach((slot) => {
      const key = slot.date.split("T")[0];
      (availableSlotsByDate[key] ||= []).push(slot);
    });

    renderCalendar();
  } catch (err) {
    console.error("Error fetching slots:", err);
    alert("Failed to load slots");
  }
}

function renderCalendar() {
  const monthLabel = document.getElementById("monthLabel");
  const calendarDays = document.getElementById("calendarDays");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i++) calendarDays.innerHTML += `<div></div>`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const iso = dateObj.toISOString().split("T")[0];

    const isPast = dateObj < today;
    const isBeyond = dateObj > maxDate;
    const hasSlots = availableSlotsByDate[iso]?.length;

    let cls = "py-1 rounded text-xs ";
    let click = "";

    if (isPast || isBeyond || !hasSlots) {
      cls += "text-gray-400 cursor-not-allowed";
    } else {
      cls += "cursor-pointer hover:bg-green-100 font-semibold";
      click = `onclick="selectDate('${iso}')"`;
    }

    calendarDays.innerHTML += `<div class="${cls}" ${click}>${d}</div>`;
  }
}

window.selectDate = function (iso) {
  document.getElementById("selectedDate").value = iso;
  selectedSlot = null;

  document
    .querySelectorAll("#calendarDays div")
    .forEach((d) => d.classList.remove("ring-2", "ring-orange-500"));

  // Extract day from ISO string directly to avoid timezone issues
  const dayNumber = parseInt(iso.split("-")[2], 10);

  [...document.querySelectorAll("#calendarDays div")]
    .find((d) => d.textContent == dayNumber)
    ?.classList.add("ring-2", "ring-orange-500");

  renderSlots(availableSlotsByDate[iso] || []);
};

function renderSlots(slots) {
  const afternoonContainer = document.getElementById("afternoonSlots");
  const eveningContainer = document.getElementById("eveningSlots");

  afternoonContainer.innerHTML = "";
  eveningContainer.innerHTML = "";

  // ✅ SORT BY ID (ASCENDING)
  const sortedSlots = [...slots].sort((a, b) => a.id - b.id);

  sortedSlots.forEach((slot) => {
    const hour = parseInt(slot.startTime.split(":")[0]);
    const label = createSlot(slot);

    hour < 16
      ? afternoonContainer.appendChild(label)
      : eveningContainer.appendChild(label);
  });

  // ⚠️ Empty state messages
  if (afternoonContainer.children.length === 0) {
    afternoonContainer.innerHTML =
      '<p class="text-gray-400 text-sm col-span-4">No afternoon slots available</p>';
  }

  if (eveningContainer.children.length === 0) {
    eveningContainer.innerHTML =
      '<p class="text-gray-400 text-sm col-span-4">No evening slots available</p>';
  }
}

function createSlot(slot) {
  const label = document.createElement("label");

  const isDisabled = slot.isBooked === true || slot.isBlocked === true;

  label.className =
    "border rounded p-2 flex items-center gap-1 " +
    (isDisabled
      ? "bg-red-50 text-red-600 cursor-not-allowed opacity-70"
      : "bg-green-50 text-green-700 cursor-pointer");

  // ❌ DO NOT CREATE RADIO FOR DISABLED SLOT
  if (!isDisabled) {
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "timeSlot";

    input.onchange = () => {
      selectedSlot = slot;
    };

    label.appendChild(input);
  }

  const span = document.createElement("span");
  span.textContent = formatTime(slot.startTime);

  label.appendChild(span);
  return label;
}

function formatTime(t) {
  const [h, m] = t.split(":");
  const hr = h % 12 || 12;
  return `${hr}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

// =============================
// LOCATION FUNCTIONS
// =============================
async function loadCountries() {
  try {
    const res = await fetch(
      "https://countriesnow.space/api/v0.1/countries/positions"
    );
    const data = await res.json();
    allCountries = data.data;

    const countrySelect = document.getElementById("country");
    allCountries.sort((a, b) => a.name.localeCompare(b.name));

    allCountries.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.name;
      option.textContent = c.name;
      countrySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading countries:", err);
  }
}

async function updateStates(country, prefillState = "", prefillCity = "") {
  const stateSelect = document.getElementById("state");
  const citySelect = document.getElementById("city");

  stateSelect.innerHTML = `<option value="">Select State</option>`;
  citySelect.innerHTML = `<option value="">Select City</option>`;

  if (!country) return;

  try {
    const res = await fetch(
      "https://countriesnow.space/api/v0.1/countries/states",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      }
    );

    const data = await res.json();
    if (data.data && data.data.states) {
      data.data.states.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.name;
        option.textContent = s.name;
        stateSelect.appendChild(option);
      });

      if (prefillState) {
        stateSelect.value = prefillState;
        updateCities(country, prefillState, prefillCity);
      }
    }
  } catch (err) {
    console.error("Error fetching states:", err);
  }
}

async function updateCities(country, stateName, prefillCity = "") {
  const citySelect = document.getElementById("city");
  citySelect.innerHTML = `<option value="">Select City</option>`;
  if (!country || !stateName) return;

  try {
    const res = await fetch(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state: stateName }),
      }
    );

    const data = await res.json();
    if (data.data && data.data.length > 0) {
      data.data.forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });

      if (prefillCity) {
        citySelect.value = prefillCity;
      }
    }
  } catch (err) {
    console.error("Error fetching cities:", err);
  }
}

function loadLocalCityDropdown() {
  const citySelect = document.getElementById("city");
  citySelect.innerHTML = `<option value="">Select City</option>`;
  cityData.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.city;
    option.textContent = c.city;
    citySelect.appendChild(option);
  });
}

async function handlePincodeInput() {
  const pin = document.getElementById("pincode").value.trim();
  if (pin.length < 6) return;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();

    if (data[0].Status === "Success") {
      const postOffice = data[0].PostOffice[0];
      const city = postOffice.District;
      const state = postOffice.State;

      document.getElementById(
        "city"
      ).innerHTML = `<option value="${city}">${city}</option>`;
      document.getElementById("state").value = state;
    } else {
      const match = cityData.find((c) => c.pincode === pin);
      if (match) {
        document.getElementById("city").value = match.city;
        document.getElementById("state").value = match.state;
      } else {
        document.getElementById(
          "city"
        ).innerHTML = `<option value="">City not found</option>`;
      }
    }
  } catch (err) {
    const match = cityData.find((c) => c.pincode === pin);
    if (match) {
      document.getElementById("city").value = match.city;
      document.getElementById("state").value = match.state;
    }
  }
}

// =============================
// PHONE COUNTRY CODE
// =============================
async function loadPhoneFlags() {
  const res = await fetch(
    "https://countriesnow.space/api/v0.1/countries/codes"
  );
  const data = await res.json();
  const countries = data.data;
  const dropdown = document.getElementById("countryDropdown");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedDial = document.getElementById("selectedDial");
  const selectedCountry = document.getElementById("selectedCountry");

  const userCountryCode =
    (Intl.DateTimeFormat().resolvedOptions().locale || "IN").split("-")[1] ||
    "IN";

  countries.sort((a, b) => a.name.localeCompare(b.name));

  countries.forEach((c) => {
    const iso = c.code.toLowerCase();
    const option = document.createElement("div");
    option.className =
      "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100";
    option.innerHTML = `<img class="w-5 h-4" src="https://flagcdn.com/32x24/${iso}.png" alt="${c.name} flag" />
    <span>${c.dial_code}</span>`;
    option.dataset.dial = c.dial_code;
    option.dataset.flag = `https://flagcdn.com/32x24/${iso}.png`;

    if (iso === userCountryCode.toLowerCase()) {
      selectedFlag.src = option.dataset.flag;
      selectedDial.textContent = option.dataset.dial;
    }

    option.addEventListener("click", () => {
      selectedFlag.src = option.dataset.flag;
      selectedDial.textContent = option.dataset.dial;
      dropdown.classList.add("hidden");
    });

    dropdown.appendChild(option);
  });

  selectedCountry.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!selectedCountry.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
}

// =============================
// FORM DATA COLLECTION
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
    time: selectedSlot?.startTime || "",
  };
}

function getPersonalDetails() {
  return {
    fullName: document.getElementById("fullName")?.value || "",
    gender: document.querySelector('input[name="gender"]:checked')?.value || "",
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
    email: document.getElementById("email")?.value || "",
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
  return document.querySelector('input[name="consulted"]:checked')?.value || "";
}

function getSpecificConcerns() {
  return document.getElementById("specificConcerns")?.value || "";
}

function getRemediesPreference() {
  return document.querySelector('input[name="remedies"]:checked')?.value || "";
}

// =============================
// VALIDATION
// =============================
function validateForm() {
  const errors = [];

  if (!getConsultType()) errors.push("Please select a consultation type");
  if (getConsultModes().length === 0)
    errors.push("Please select at least one consultation mode");
  if (!selectedSlot) errors.push("Please select a date and time slot");

  const personal = getPersonalDetails();
  if (!personal.fullName) errors.push("Please enter your full name");
  if (!personal.gender) errors.push("Please select your gender");
  if (!personal.dob) errors.push("Please enter your date of birth");
  if (!personal.tob) errors.push("Please enter your time of birth");

  const birthPlace = getBirthPlace();
  if (
    !birthPlace.country ||
    !birthPlace.state ||
    !birthPlace.city ||
    !birthPlace.pincode
  ) {
    errors.push("Please complete all birth place fields");
  }

  const contact = getContactDetails();
  if (!contact.phone || contact.phone.length < 10)
    errors.push("Please enter a valid phone number");
  if (!contact.email) errors.push("Please enter your email address");

  const agreeCheckbox = document.getElementById("agreeCheckbox");
  if (!agreeCheckbox?.checked)
    errors.push("Please agree to the declaration terms");

  return errors;
}

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
    slotId: selectedSlot?.id,
  };
}

// =============================
// PAYMENT HANDLING
// =============================
async function handlePay(amount) {
  console.log("💰 handlePay called with amount:", amount);

  const errors = validateForm();
  if (errors.length > 0) {
    alert("Please complete the form:\n\n" + errors.join("\n"));
    return;
  }

  const payload = buildConsultationPayload(amount);
  console.log("📦 Payload built:", payload);

  if (!payload.slotId) {
    alert("⚠️ Please select a time slot before proceeding to payment");
    return;
  }

  try {
    console.log("📤 Sending booking request...");
    const res = await fetch(`${BackendUrl}/api/v1/book-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("📥 Response from backend:", data);

    if (!data.success) {
      alert(data.message || "Failed to create order!");
      return;
    }

    window.tempConsultationForm = payload;

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "Astrologer Suvendu Paul",
      description: "Consultation Booking Fee",
      order_id: data.orderId,

      handler: async function (response) {
        console.log("🔥 Payment completed! Verifying...");

        try {
          const verifyRes = await fetch(`${BackendUrl}/api/v1/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              formData: window.tempConsultationForm,
            }),
          });

          const verifyData = await verifyRes.json();
          console.log("🔍 Verification response:", verifyData);

          if (verifyData.success) {
            alert(
              `🎉 Payment successful!\n\nYour consultation has been booked.\nBooking ID: ${verifyData.consultationId}\n\nYou will receive a confirmation email shortly.`
            );
            setTimeout(() => window.location.reload(), 2000);
          } else {
            alert(
              "❌ Payment verification failed!\n" +
                (verifyData.error || "Please contact support.")
            );
          }
        } catch (err) {
          console.error("⚠️ Verification error:", err);
          alert("❌ Payment verification failed! Please contact support.");
        }
      },

      prefill: {
        name: payload.personal.fullName,
        email: payload.contact.email,
        contact: payload.contact.phone,
      },

      theme: {
        color: "#4A2F2B",
      },

      modal: {
        ondismiss: function () {
          console.log("⚠️ Payment popup closed by user");
          alert("Payment cancelled. Your slot selection has been released.");
        },
      },
    };

    const razorpayObject = new Razorpay(options);
    razorpayObject.open();
  } catch (err) {
    console.error("⚠️ Error in handlePay:", err);
    alert("An error occurred. Please try again.");
  }
}

// =============================
// INITIALIZE
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Auto-fill today's date
  document.getElementById("dateInput").value = new Date()
    .toISOString()
    .split("T")[0];

  // Fetch available slots
  fetchAvailableSlots();

  // Load countries and local cities
  loadCountries();
  loadLocalCityDropdown();
  loadPhoneFlags();

  // Event listeners for location
  document.getElementById("country").addEventListener("change", (e) => {
    updateStates(e.target.value);
  });

  document.getElementById("state").addEventListener("change", (e) => {
    const country = document.getElementById("country").value;
    updateCities(country, e.target.value);
  });

  document.getElementById("city").addEventListener("change", () => {
    const selectedCity = document.getElementById("city").value;
    const match = cityData.find((c) => c.city === selectedCity);
    if (match) {
      document.getElementById("pincode").value = match.pincode;
      document.getElementById("state").value = match.state;
    }
  });

  document
    .getElementById("pincode")
    .addEventListener("input", handlePincodeInput);

  // Calendar navigation
  document.getElementById("prevMonth").addEventListener("click", (e) => {
    e.preventDefault();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);

    // Don't allow going before current month
    if (newDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    }
  });

  document.getElementById("nextMonth").addEventListener("click", (e) => {
    e.preventDefault();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);

    // Don't allow going beyond 3 months from today
    const maxMonthDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    if (newDate < maxMonthDate) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    }
  });

  // Payment button toggle
  const agreeCheckbox = document.getElementById("agreeCheckbox");
  const payBtn = document.getElementById("payButton");
  const payBtn1 = document.getElementById("payButton1");

  function togglePayButtons() {
    const buttons = [payBtn, payBtn1];
    buttons.forEach((btn) => {
      if (agreeCheckbox.checked) {
        btn.disabled = false;
        btn.classList.remove(
          "opacity-50",
          "cursor-not-allowed",
          "bg-purple-400"
        );
        btn.classList.add("bg-purple-700", "hover:bg-purple-800");
      } else {
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed", "bg-purple-400");
        btn.classList.remove("bg-purple-700", "hover:bg-purple-800");
      }
    });
  }

  agreeCheckbox.addEventListener("change", togglePayButtons);
  togglePayButtons();

  // Payment handlers
  payBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handlePay(500);
  });

  payBtn1.addEventListener("click", (e) => {
    e.preventDefault();
    handlePay(1800);
  });
});

// Debug helper
window.debugSlots = function () {
  console.log("📊 Current State:");
  console.log("Available slots by date:", availableSlotsByDate);
  console.log("Selected slot:", selectedSlot);
  console.log("Form data:", buildConsultationPayload(0));
};

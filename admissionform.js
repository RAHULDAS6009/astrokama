// ------------------------------
// Toggle Password
// ------------------------------
function togglePassword() {
  const input = document.getElementById("password");
  input.type = input.type === "password" ? "text" : "password";
}

// ------------------------------
// Relation: Show "Other"
// ------------------------------
document.getElementById("relation").addEventListener("change", function () {
  const otherDiv = document.getElementById("otherRelationDiv");
  const otherInput = document.getElementById("otherRelation");

  if (this.value === "Other") {
    otherDiv.style.display = "block";
    otherInput.required = true;
  } else {
    otherDiv.style.display = "none";
    otherInput.required = false;
    otherInput.value = "";
  }
});

// ------------------------------
// Same Address
// ------------------------------
document.getElementById("sameAddress").addEventListener("change", function () {
  if (this.checked) {
    document.getElementById("permanentAddress").value = document.getElementById(
      "communicationAddress"
    ).value;
  }
});

// ------------------------------
// Same Phone
// ------------------------------
document.getElementById("samePhone").addEventListener("change", function () {
  if (this.checked) {
    document.getElementById("whatsapp").value =
      document.getElementById("phone").value;
  }
});

// ------------------------------
// Load Courses & Branches
// ------------------------------
async function loadCourses() {
  try {
    const res = await fetch("https://api.rahuldev.live/allcourse");
    const data = await res.json();

    const courseSelect = document.getElementById("courseId");
    courseSelect.innerHTML = `<option value="">Select Course</option>`;

    data.data.forEach((course) => {
      (course.branches || []).forEach((branch) => {
        const opt = document.createElement("option");
        opt.value = branch.id;
        opt.textContent = `${course.name} - ${branch.name}`;
        courseSelect.appendChild(opt);
      });
    });
  } catch (err) {
    console.error("Error loading courses", err);
  }
}
loadCourses();

// When course changes → load branches
document.getElementById("courseId").addEventListener("change", async (e) => {
  const res = await fetch(
    `https://api.rahuldev.live/get-branches/${e.target.value}`
  );

  const data = await res.json();
  const branchSelect = document.getElementById("branchId");

  branchSelect.innerHTML = `<option value="">Select Branch</option>`;

  data.branches.forEach((b) => {
    branchSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });
});

// ------------------------------
// Upload File
// ------------------------------
async function uploadFile(file) {
  if (!file) return null;

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("https://api.rahuldev.live/upload-file", {
    method: "POST",
    body: fd,
  });

  const json = await res.json();
  return json.url;
}

// ------------------------------
// MAIN: Submit Admission
// ------------------------------
async function submitAdmissionForm(event) {
  event.preventDefault();

  try {
    const formData = new FormData();

    formData.append("name", document.getElementById("name").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("password", document.getElementById("password").value);
    formData.append(
      "guardianName",
      document.getElementById("guardianName").value
    );
    formData.append(
      "relationWithGurdain",
      document.getElementById("relation").value
    );
    formData.append(
      "communicationAddress",
      document.getElementById("communicationAddress").value
    );
    formData.append(
      "permanentAddress",
      document.getElementById("permanentAddress").value
    );
    formData.append("mobileNumber", document.getElementById("phone").value);
    formData.append(
      "whatsappNumber",
      document.getElementById("whatsapp").value
    );
    formData.append("courseId", document.getElementById("courseId").value);
    formData.append("branchId", document.getElementById("branchId").value);
    formData.append(
      "dateOfBirth",
      document.getElementById("dateOfBirth").value
    );
    formData.append(
      "placeOfBirth",
      document.getElementById("placeOfBirth").value
    );
    formData.append(
      "educationalQualification",
      document.getElementById("educationalQualification").value
    );
    formData.append(
      "extraExperience",
      document.getElementById("extraExperience").value
    );
    formData.append(
      "astrologicalExperience",
      document.getElementById("astrologicalExperience").value
    );
    formData.append("courseMode", document.getElementById("courseMode").value);

    // Files:
    formData.append("photo", document.getElementById("photo").files[0]);
    formData.append("signature", document.getElementById("signature").files[0]);
    formData.append("marksheet", document.getElementById("marksheet").files[0]);
    formData.append(
      "certificate",
      document.getElementById("certificate").files[0]
    );

    // ------------------------------
    // Create Razorpay Order
    // ------------------------------
    const orderResponse = await fetch(
      "https://api.rahuldev.live/api/v1/student/fees/pay/create-order",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 50000,
          description: "Admission Fee",
        }),
      }
    );

    const orderData = await orderResponse.json();
    const orderId = orderData.order.id;

    // ------------------------------
    // Razorpay Checkout
    // ------------------------------
    const options = {
      key: "rzp_live_RrRYZuibDhBXGt",
      amount: orderData.order.amount,
      currency: "INR",
      name: "Astrology Institute",
      description: "Admission Payment",
      order_id: orderId,

      handler: async function (response) {
        formData.append("razorpay_payment_id", response.razorpay_payment_id);
        formData.append("razorpay_order_id", response.razorpay_order_id);
        formData.append("razorpay_signature", response.razorpay_signature);

        const saveResponse = await fetch(
          "https://api.rahuldev.live/api/v1/student/admission/create",
          {
            method: "POST",
            body: formData,
          }
        );

        const saveData = await saveResponse.json();

        if (saveData.success) {
          alert("Admission Submitted Successfully!");
          document.getElementById("admissionForm").reset();
        } else {
          alert("Error saving form");
        }
      },

      prefill: {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        contact: document.getElementById("mobileNumber").value,
      },

      theme: { color: "#6a1b9a" },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
}

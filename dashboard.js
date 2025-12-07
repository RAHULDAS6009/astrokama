function navigateStudentCorner(){
    window.location.href="studentcorner.html"
}

const studentData = {
      batch: {
        name: "Full Stack Development – Batch A",
        timings: "Mon–Fri, 7 PM – 9 PM",
        startDate: "10th June 2025",
        mentor: "Rahul Sharma",
      },

      payments: [
        { month: "January 2025", status: "Paid", amount: 1500 },
        { month: "February 2025", status: "Pending", amount: 1500 }
      ],

      materials: [
        { title: "Module 1 – Basics", size: "2.3 MB" },
        { title: "Module 2 – JavaScript", size: "3.1 MB" },
        { title: "Module 3 – React", size: "4.0 MB" }
      ],

      semesters: [
        {
          name: "Semester 1",
          subjects: [
            { title: "C Programming", marks: 85 },
            { title: "Digital Logic", marks: 78 },
            { title: "Maths 1", marks: 90 }
          ]
        },
        {
          name: "Semester 2",
          subjects: [
            { title: "Data Structures", marks: 92 },
            { title: "Discrete Maths", marks: 88 },
            { title: "Computer Architecture", marks: 80 }
          ]
        }
      ]
    };

    // Render Batch
    const batchFields = {
      "Batch Name": studentData.batch.name,
      "Class Timings": studentData.batch.timings,
      "Start Date": studentData.batch.startDate,
      "Mentor": studentData.batch.mentor,
    };

    const batchDiv = document.getElementById("batchDetails");
    batchDiv.innerHTML = Object.entries(batchFields)
      .map(([key, value]) => `
        <div class="bg-[#523A35]/10 p-4 rounded-lg text-[#523A35]">
          <p class="opacity-70 text-sm">${key}</p>
          <p class="text-lg font-bold">${value}</p>
        </div>
      `).join("");

    // Render Payments
    document.getElementById("paymentTable").innerHTML = studentData.payments.map(p => `
      <tr>
        <td class="py-3 px-4">${p.month}</td>
        <td class="py-3 px-4">
          <span class="${p.status === "Paid" ? "pill-paid" : "pill-pending"}">${p.status}</span>
        </td>
        <td class="py-3 px-4">₹${p.amount}</td>
        <td class="py-3 px-4">
          ${p.status === "Paid" ?
            `<button class='btn btn-outline'>View Receipt</button>` :
            `<button class='btn btn-primary'>Pay Now</button>`}
        </td>
      </tr>
    `).join("");

    // Render Materials
    document.getElementById("materials").innerHTML = studentData.materials.map(m => `
      <div class="bg-[#523A35]/10 p-4 rounded-lg text-[#523A35]">
        <h3 class="font-semibold">${m.title}</h3>
        <p class="text-sm opacity-70 mb-3">PDF • ${m.size}</p>
        <button class="btn btn-primary w-full">Download</button>
      </div>
    `).join("");

    // Render Semesters
    document.getElementById("semesters").innerHTML = studentData.semesters.map(s => `
      <div class="bg-[#523A35]/10 p-4 rounded-lg text-[#523A35]">
        <h3 class="text-lg font-bold mb-2">${s.name}</h3>
        <table class="w-full text-left">
          ${s.subjects.map(sub => `
            <tr class="border-b border-[#523A35]/10">
              <td class="py-2">${sub.title}</td>
              <td class="py-2 font-semibold">${sub.marks} / 100</td>
            </tr>`).join("")}
        </table>
      </div>
    `).join("");

$(document).ready(function() {
  let workbook,
    classes = [],
    students = [];
  $("#classes").hide();
  $("#excelFile").on("change", function(e) {
    let file = e.target.files[0],
      reader = new FileReader();
    classes = [],
      students = [];
    reader.onload = function(e) {
      console.log("File loaded");
      workbook = XLSX.read(new Uint8Array(e.target.result), {
        type: "array"
      });
      let sheets = Object.keys(workbook.Sheets);
      $("#selectClassItems").empty();
      for (let i = 0; i < sheets.length; i++) {
        if (sheets[i] === "Students") {
          for (let j = 0; j < 1000; j++) {
            let studentID = workbook.Sheets[sheets[i]]["A" + (j + 2)];
            if (studentID) {
              students.push({
                id: studentID.v,
                lastName: workbook.Sheets[sheets[i]]["B" + (j + 2)] && workbook.Sheets[sheets[i]]["B" + (j + 2)].v ? workbook.Sheets[sheets[i]]["B" + (j + 2)].v : "",
                firstName: workbook.Sheets[sheets[i]]["C" + (j + 2)] && workbook.Sheets[sheets[i]]["C" + (j + 2)].v ? workbook.Sheets[sheets[i]]["C" + (j + 2)].v : "",
                grade: workbook.Sheets[sheets[i]]["D" + (j + 2)] && workbook.Sheets[sheets[i]]["D" + (j + 2)].v ? workbook.Sheets[sheets[i]]["D" + (j + 2)].v : -1,
                email: workbook.Sheets[sheets[i]]["E" + (j + 2)] && workbook.Sheets[sheets[i]]["E" + (j + 2)].v ? workbook.Sheets[sheets[i]]["E" + (j + 2)].v : ""
              });
            }
          }
        } else if (sheets[i] !== "Classes") {
          let studentsInClass = [];
          for (let j = 0; j < 500; j++) {
            let studentID = workbook.Sheets[sheets[i]]["D" + (j + 2)];
            if (studentID) {
              studentsInClass.push(studentID.v);
            }
          }
          classes.push({
            id: sheets[i],
            name: (workbook.Sheets[sheets[i]].B2 && workbook.Sheets[sheets[i]].B2.v) ? workbook.Sheets[sheets[i]].B2.v : "Unnamed Class",
            classCount: workbook.Sheets[sheets[i]].B3 && workbook.Sheets[sheets[i]].B3.v ? workbook.Sheets[sheets[i]].B3.v : 1,
            teacher: workbook.Sheets[sheets[i]].B4 && workbook.Sheets[sheets[i]].B4.v ? workbook.Sheets[sheets[i]].B4.v : "Teacher " + Math.floor(Math.random() * 100000),
            grade: workbook.Sheets[sheets[i]].B5 && workbook.Sheets[sheets[i]].B5.v ? workbook.Sheets[sheets[i]].B5.v : -1,
            students: studentsInClass
          });
          let currentClass = classes[classes.length - 1];
          $("#selectClassItems").append(`
            <a class="dropdown-item ${classes.length === 1 ? "active" : ""} text-truncate" href="#">
              <span class="sr-only">Class ID</span>
              <span class="classID">${currentClass.id}</span>
              <span class="sr-only">Class Name</span>
              <small><strong>${currentClass.name}</strong></small>
            </a>
          `);
        }
      }
      $("#runNode,#runBrowser").removeClass("disabled");
      $("#classes").show();
      $("#selectClassItems > a").click(function(e) {
        e.preventDefault();
        let classID = $(e.currentTarget).children(".classID").text(),
          currentClass = classes.find((a) => a.id === classID);
        $("#selectClassItems > a").removeClass("active");
        $(e.currentTarget).addClass("active");
        $("#displayClassInfo > tbody").html("");
        $("#displayClassInfo > tbody").append(`
          <tr>
            <td scope="row">${classID}</td>
            <td>${currentClass.name}</td>
            <td>${currentClass.classCount}</td>
            <td>${currentClass.teacher}</td>
            <td>${currentClass.grade}</td>
          </tr>
        `);
        $("#displayStudents > tbody").html("");
        for (let i = 0; i < currentClass.students.length; i++) {
          let currentSheet = workbook.Sheets[classID];
          let student = {
            id: currentSheet["D" + (i + 2)].v,
            name: currentSheet["E" + (i + 2)].v,
            grade: currentSheet["F" + (i + 2)].v,
            email: currentSheet["G" + (i + 2)].v
          };
          $("#displayStudents > tbody").append(`
            <tr>
              <td scope="row">${student.id}</td>
              <td>${student.name}</td>
              <td>${student.grade}</td>
              <td>${student.email}</td>
            </tr>
          `);
        }
      });
      $("#selectClassItems > a").eq(0).click();
    }
    reader.readAsArrayBuffer(file);
  });

  $("#runNode").click(function() {
    let blockCount = parseInt($("#blockCount").val()),
      teacherWeight = parseInt($("#teacherWeight").val()),
      iterations = parseInt($("#iterations").val()),
      speed = (101 - parseFloat($("#speed").val())) / 101;
    if (!$("#runNode").hasClass("disabled")) {
      $("#runNodeModal").modal("show");
      $("#runNodeCode").text(`;console.log("=".repeat(20));console.log(schedule(${JSON.stringify(classes)},${blockCount},${teacherWeight},${speed},${iterations}));`)
      $("#runNodeOutput").val("");
    }
  });

  $("#runBrowser").click(function() {
    let blockCount = parseInt($("#blockCount").val()),
      teacherWeight = parseInt($("#teacherWeight").val()),
      iterations = parseInt($("#iterations").val()),
      speed = (101 - parseFloat($("#speed").val())) / 101,
      output;
    if (!$("#runBrowser").hasClass("disabled")) {
      output = schedule(classes, blockCount, teacherWeight, speed, iterations);
      scheduletoExcel(output);
    }
  });

  $("#runNodeDone").click(function() {
    let output = $("#runNodeOutput").val().replace(/^=*\n/, "").replace(/'/g, "\"");
    try {
      output = JSON.parse(output);
      $("#runNodeOutput").removeClass("is-invalid");
      console.log("Output interpreted successfully");
      scheduletoExcel(output);
    } catch (e) {
      $("#runNodeOutput").addClass("is-invalid");
    }
  });

  function scheduletoExcel(schedule) {
    let newWorkbook = XLSX.utils.book_new();
    for (let i = 0; i < schedule.length; i++) {
      let sheet = [],
        block = schedule[i];
      for (let j = 0; j < block.length; j++) {
        let currentClass = classes.find((a) => a.id === block[j]);
        sheet.push([`${currentClass.name} (${currentClass.id})`]);
        sheet.push([`Teacher: ${currentClass.teacher}`]);
        sheet.push([`Grade: ${currentClass.grade}`]);
        sheet.push(["Student ID", "Last Name", "First Name", "Grade", "Email"]);
        for (let k = 0; k < currentClass.students.length; k++) {
          let currentStudent = students.find((a) => a.id === currentClass.students[k]);
          sheet.push([currentStudent.id, currentStudent.lastName, currentStudent.firstName, currentStudent.grade, currentStudent.email]);
        }
        sheet.push([undefined]);
      }
      XLSX.utils.book_append_sheet(newWorkbook, XLSX.utils.aoa_to_sheet(sheet), `Block ${i + 1}`);
    }
    XLSX.writeFile(newWorkbook, "Schedule.xlsx");
  }
});

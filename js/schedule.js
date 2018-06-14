// Algorithm based on http://lalescu.ro/liviu/fet/doc/en/generation-algorithm-description.html
// Notes:
// {blockCount} is the amount of blocks per schedule period

// {teacherWeight} is the weight of a teacher in terms of students; the larger the value, the smaller
// the tolerance for teacher conflicts; recommended value is the average size of a class, between 10
// and 15

// {proportionChecked} is value between 0 and 1 representing the proportion of blocks checked of {blockCount}
// when trying to put a class into a block; the larger the value, the slower the program runs; recommended
// value is between 0.6 and 0.8

// {iterations} is the maximum iterations run; the larger the value, the slower the program runs but
// better results are returned

// {classes} stored with id, grade level, name, teacher's email, and students listed by id; each class,
// teacher, and student id must be unique

function schedule(classes, blockCount, teacherWeight, proportionChecked, iterations) {
  function classInfo(classId) {
    for (let i = 0, length = classes.length; i < length; ++i) {
      if (classes[i].id === classId) {
        return classes[i];
      }
    }
  }

  function checkConflicts(classSchedule) {
    let conflicts = {
      students: [],
      teachers: []
    };
    for (let i = 0, length = classSchedule.length; i < length; ++i) {
      let [students, teachers] = [
        [],
        []
      ];
      for (let j of classSchedule[i]) {
        students.push(...classInfo(j).students);
        teachers.push(classInfo(j).teacher);
      }
      let countStudents = {},
        countTeachers = {};
      conflicts.students[i] = [];
      conflicts.teachers[i] = [];
      for (let j = 0, length = students.length; j < length; ++j) {
        if (countStudents[students[j]]) {
          conflicts.students[i].push(students[j]);
        } else {
          countStudents[students[j]] = 1;
        }
      }
      for (let j = 0, length = teachers.length; j < length; ++j) {
        if (countTeachers[teachers[j]]) {
          conflicts.teachers[i].push(students[j]);
        } else {
          countTeachers[teachers[j]] = 1;
        }
      }
    }
    return conflicts;
  }

  function blockCheckConflictsWeight(block) {
    let conflictStudents = conflictTeachers = 0;
    let [students, teachers] = [
      [],
      []
    ];
    //let teachersWeighted = {};
    for (let j of block) {
      let info = classInfo(j);
      students.push(...info.students);
      teachers.push(info.teacher);
      /*if (teachersWeighted[info.teacher]) {
        teachersWeighted[info.teacher].push(info.students.length);
      } else {
        teachersWeighted[info.teacher] = [info.students.length];
      }*/
    }
    let countStudents = {},
      countTeachers = {};
    //let countTeachersWeight = Object.keys(teachersWeighted).map((a) => teachersWeighted[a].reduce((a, b) => a + b, 0) - Math.max(...teachersWeighted[a]), 0);
    for (let i = 0, length = students.length; i < length; ++i) {
      if (countStudents[students[i]]) {
        ++conflictStudents;
      } else {
        countStudents[students[i]] = 1;
      }
    }
    for (let i = 0, length = teachers.length; i < length; ++i) {
      if (countTeachers[teachers[i]]) {
        ++conflictTeachers;
      } else {
        countTeachers[teachers[i]] = 1;
      }
    }
    //conflicts.teachersWeighted = countTeachersWeight.reduce((a, b) => a + b, 0);
    return {
      students: conflictStudents,
      teachers: conflictTeachers
    };
  }

  function displaySchedule(classSchedule) {
    let string = "";
    for (let i = 0, length = classSchedule.length; i < length; ++i) {
      string += `Block ${i + 1}\n`;
      let sortedClassSchedule = classSchedule[i].sort((a, b) => classInfo(b).grade - classInfo(a).grade || classInfo(b).name - classInfo(a).name);
      for (let j of sortedClassSchedule) {
        let info = classInfo(j);
        string += `    ${info.id}    ${info.grade}    ${info.name}    ${info.teacher}\n`
      }
    }
    return string;
  }

  let allClasses = [];
  for (let i of classes) {
    for (let j = 0, length = i.classCount; j < length; ++j) {
      allClasses.push(i.id);
    }
  }

  // Sort classes by amount of students (descending)
  let allClassesSorted = allClasses.sort((a, b) => classInfo(b).students.length - classInfo(a).students.length);

  function timetabling(remainingClasses, maxRecursion, schedule, flag) {
    if (!remainingClasses.length) {
      return schedule;
    }
    let newSchedule = [];
    if (!schedule) {
      for (; newSchedule.push([]) < blockCount;);
    } else {
      newSchedule = schedule.map((a) => [...a]);
    }

    // Find the number of conflicts that would result if put in each slot
    let conflictNum = [];
    for (let i = 0, length = newSchedule.length; i < length; ++i) {
      let conflicts = blockCheckConflictsWeight(newSchedule[i].concat(remainingClasses[0]));
      conflictNum[i] = {
        scheduleNum: i,
        //conflict: conflicts.students + conflicts.teachersWeighted,
        conflict: conflicts.students + conflicts.teachers * teacherWeight
      };
    }
    conflictNum = conflictNum.sort((a, b) => a.conflict - b.conflict || Math.random() - 0.5);

    // Place the class in a slot
    let success = true;
    for (let i = 0, length = proportionChecked * conflictNum.length; i < length; ++i) {
      let success = true;

      // If a slot allows 0 conflicts, then put the class in the slot
      if (conflictNum[i].conflict === 0) {
        newSchedule[conflictNum[i].scheduleNum].push(remainingClasses[0]);
        break;
      }

      // Else, put in a random slot with the least conflicts
      // Remove the other classes in the slot and recursively place them elsewhere, if possible
      if (maxRecursion > 0) {
        let reallocateClasses = [...newSchedule[conflictNum[i].scheduleNum]];

        let newTimetable = newSchedule.map((a) => [...a]);
        newTimetable[conflictNum[i].scheduleNum] = [remainingClasses[0]];
        newTimetable = timetabling(reallocateClasses, maxRecursion - 1, newTimetable, true);

        if (newTimetable) {
          let newScheduleConflicts = newTimetableConflicts = 0;
          for (let j = 0, length = newSchedule.length; j < length; ++j) {
            let blockConflicts = blockCheckConflictsWeight(newSchedule[j]);
            newScheduleConflicts += blockConflicts.students + blockConflicts.teachers * teacherWeight;
          }
          for (let j = 0, length = newTimetable.length; j < length; ++j) {
            let blockConflicts = blockCheckConflictsWeight(newTimetable[j]);
            newTimetableConflicts += blockConflicts.students + blockConflicts.teachers * teacherWeight;
          }
          if (newTimetableConflicts <= newScheduleConflicts) {
            newSchedule = newTimetable;
            break;
          } else if (flag) {
            success = false;
          } else {
            newSchedule[conflictNum[0].scheduleNum].push(remainingClasses[0]);
            break;
          }
        } else if (flag) {
          success = false;
        } else {
          newSchedule[conflictNum[0].scheduleNum].push(remainingClasses[0]);
          break;
        }
      } else {
        if (flag) {
          success = false;
        } else {
          newSchedule[conflictNum[0].scheduleNum].push(remainingClasses[0]);
          break;
        }
      }
    }
    return success ? timetabling(remainingClasses.slice(1), maxRecursion, newSchedule) : false;
  }
  return timetabling(allClassesSorted, iterations);
}

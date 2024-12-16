/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/clubs.js":
/*!**********************!*\
  !*** ./src/clubs.js ***!
  \**********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n// Club management functionality\nvar clubForm = document.getElementById('club-form');\nvar clubList = document.getElementById('club-list');\n\n// Load clubs from localStorage\nvar clubs = JSON.parse(localStorage.getItem('clubs') || '[]');\n\n// Render clubs\nfunction renderClubs() {\n  clubList.innerHTML = '';\n  clubs.sort(function (a, b) {\n    return b.distance - a.distance;\n  }).forEach(function (club, index) {\n    var clubElement = document.createElement('div');\n    clubElement.className = 'flex items-center justify-between bg-gray-700/50 p-4 rounded-lg';\n    clubElement.innerHTML = \"\\n            <div class=\\\"flex items-center gap-4\\\">\\n                <div class=\\\"w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center\\\">\\n                    <i class=\\\"fas fa-golf-ball text-green-400\\\"></i>\\n                </div>\\n                <div>\\n                    <div class=\\\"text-white font-semibold\\\">\".concat(club.type, \"</div>\\n                    <div class=\\\"text-gray-400 text-sm\\\">\").concat(club.distance, \" yards</div>\\n                </div>\\n            </div>\\n            <button onclick=\\\"deleteClub(\").concat(index, \")\\\" class=\\\"text-red-400 hover:text-red-300\\\">\\n                <i class=\\\"fas fa-trash\\\"></i>\\n            </button>\\n        \");\n    clubList.appendChild(clubElement);\n  });\n}\n\n// Add new club\nclubForm.addEventListener('submit', function (e) {\n  e.preventDefault();\n  var type = document.getElementById('club-type').value;\n  var distance = parseInt(document.getElementById('club-distance').value);\n  if (!type || !distance) {\n    alert('Please fill in all fields');\n    return;\n  }\n  clubs.push({\n    type: type,\n    distance: distance\n  });\n  localStorage.setItem('clubs', JSON.stringify(clubs));\n  renderClubs();\n  clubForm.reset();\n});\n\n// Delete club\nwindow.deleteClub = function (index) {\n  if (confirm('Are you sure you want to delete this club?')) {\n    clubs.splice(index, 1);\n    localStorage.setItem('clubs', JSON.stringify(clubs));\n    renderClubs();\n  }\n};\n\n// Initial render\nrenderClubs();\n\n//# sourceURL=webpack://golf-yardage-calculator/./src/clubs.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/clubs.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;
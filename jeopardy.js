const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api";


const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

let categories = [];

/** get NUM_CATEGORIES random category IDs from API. */
async function getCategoryIds() {
  console.log("Fetching categories...");
  const res = await axios.get(`${BASE_API_URL}/categories?count=100`);
  //shuffle and pick first 6 unique category IDs
  let allCats = res.data;
  let shuffled = _.shuffle(allCats); //lodash built in function
  let selected = shuffled.slice(0, NUM_CATEGORIES);
  let catIds = selected.map(c => c.id);
  console.log("Selected category IDs:", catIds);
  return catIds;
}

/** fetch category data for a given category id */
async function getCategory(catId) {
  console.log(`Fetching category data for id ${catId}...`);
  const res = await axios.get(`${BASE_API_URL}/category?id=${catId}`);
  //picks 5 clues randomly
  let clues = _.sampleSize(res.data.clues, NUM_QUESTIONS_PER_CAT).map(c => ({
    question: c.question,
    answer: c.answer,
    showing: null
  }));
  return { title: res.data.title, clues: clues };
}

/** fills the table with categories and questions */
function fillTable() {
  console.log("Filling table...");
  const $thead = $("#jeopardy thead");
  const $tbody = $("#jeopardy tbody");

  $thead.empty();
  $tbody.empty();

  //creates header row with category titles
  const $headerRow = $("<tr>");
  for (let cat of categories) {
    $headerRow.append($("<td>").text(cat.title));
  }
  $thead.append($headerRow);

  //creates rows for questions (with ? initially)
  for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
    const $row = $("<tr>");
    for (let cat of categories) {
      const $cell = $("<td>").text("?");
      $cell.data("catIndex", categories.indexOf(cat));
      $cell.data("clueIndex", i);
      $row.append($cell);
    }
    $tbody.append($row);
  }
}

/** shows question or answer on click */
function handleClick(evt) {
  const $cell = $(evt.target);
  const catIndex = $cell.data("catIndex");
  const clueIndex = $cell.data("clueIndex");

  if (catIndex === undefined || clueIndex === undefined) {
    return;
  }

  const clue = categories[catIndex].clues[clueIndex];

  if (!clue.showing) {
    $cell.text(clue.question);
    clue.showing = "question";
  } else if (clue.showing === "question") {
    $cell.text(clue.answer);
    clue.showing = "answer";
  } else {
    // Do nothing if already showing answer
  }
}

/** shows loading spinner and disable button */
function showLoadingView() {
  $("#spinner").show();
  $("#start").prop("disabled", true);
}

/** hides loading spinner and enable button */
function hideLoadingView() {
  $("#spinner").hide();
  $("#start").prop("disabled", false);
}

/** setup and start the game with debug logs */
async function setupAndStart() {
  try {
    console.log("🚀 setupAndStart starting...");
    showLoadingView();

    const catIds = await getCategoryIds();
    console.log("✅ got category IDs:", catIds);

    const categoriesData = [];
    for (let id of catIds) {
      const category = await getCategory(id);
      categoriesData.push(category);
    }

    categories = categoriesData;
    console.log("✅ All categories loaded:", categories);

    fillTable();

    hideLoadingView();
    console.log("✅ setupAndStart finished!");
  } catch (err) {
    console.error("❌ setupAndStart failed:", err);
    hideLoadingView();
  }
}

/** binds event handlers for start button and clue clicks */
function setupEventListeners() {
  $("#start").on("click", setupAndStart);
  $("#jeopardy").on("click", "td", handleClick);
}

// when the page loads, set up event listeners
$(setupEventListeners);


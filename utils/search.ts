
import nodes from "../data/nodes";
import selectNodeExplicit, { selectLinksExplicit } from "../src/graph";
import { resetNodeExplicit, selectNodesExplicit } from "../src/graph";

const searchWrapper = document.querySelector(".search-box")
const inputBox = searchWrapper.querySelector("input")
const suggBox = searchWrapper.querySelector(".autocom_box")


inputBox.onkeyup = (e) => {
    resetNodeExplicit();
    let userData = (e.target as HTMLInputElement).value;
    let emptyArray = [];
    if (userData) {
        emptyArray = nodes.filter((data) => {
            return data.label.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
        });
        emptyArray = emptyArray.map((data) => {
            selectNodesExplicit(data);
            return data = '<li>' + data.label + '</li>';
        });
        selectLinksExplicit()
        searchWrapper.classList.add("active");
        showSuggestions(emptyArray);
        let allList = suggBox.querySelectorAll("li");
        for (let index = 0; index < allList.length; index++) {
            //onclick attributes
            allList[index].setAttribute("onclick", "select(this)")
        }
    }
    else {
        searchWrapper.classList.remove("active");
        resetNodeExplicit();
    }
}

function select(element) {
    let selectUserData = element.textContent;
    inputBox.value = selectUserData;
    searchWrapper.classList.remove("active");
    let emptyArray = nodes.filter((data) => {
        return data.label.startsWith(selectUserData);
    });
    selectNodeExplicit(emptyArray.values().next().value);
}

function showSuggestions(list) {
    let listData;
    if (!list.length) {
        let userValue = inputBox.value;
        listData = '<li>' + userValue + '</li>';
    }
    else {
        listData = list.join('');
    }
    suggBox.innerHTML = listData;
}

window.onselect = select;
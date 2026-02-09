const API="/api/tasks";


async function fetchTasks(){
const res = await fetch(API);
const data = await res.json();
const list = document.getElementById("taskList");
list.innerHTML="";


data.forEach(t=>{
const li=document.createElement("li");
if(t.completed) li.classList.add("completed");


li.innerHTML=`
<span onclick="toggleTask('${t._id}')">${t.title}</span>
<button onclick="deleteTask('${t._id}')">X</button>
`;


list.appendChild(li);
});
}


async function addTask(){
const input=document.getElementById("taskInput");
await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:input.value})});
input.value="";
fetchTasks();
}


async function deleteTask(id){
await fetch(API+"/"+id,{method:"DELETE"});
fetchTasks();
}


async function toggleTask(id){
await fetch(API+"/"+id,{method:"PUT"});
fetchTasks();
}


fetchTasks();

let btn  = document.querySelector("[data-target-btn]");
let modal  = document.querySelector("[data-modal-cont]");

btn.onclick = (e)=>{
    modal.style.display = "flex"

    if(modal){
        modal.onclick = ()=>{
            modal.style.display = "none"
        }
    }
}
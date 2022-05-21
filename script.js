var blocks = [];

class Block {
    
    constructor(repr, val, pos) {
        this.repr = repr;
        this.pos = pos;
        this.val = val;

        this.repr.firstChild.textContent = this.val;
    }
    
    moveTo(newPos) {
        this.pos = newPos;
        this.repr.style.transform = "translateX(" + ((newPos) * scaled_width) + "px)";
    }
}


function initBlocks() {

    for(let i=0; i<num_elem; i++) {
        let t = document.createElement("div");
        t.classList.add("block");
        t.appendChild( document.createElement("div") );
        blocks_container.appendChild(t);
    }
    
    let html_blocks = document.querySelectorAll(".block");

    let starting_positions = [];
    for(let i=1; i<=num_elem; i++) starting_positions.push(i);

    blocks = [];
    for(let i=0; i<html_blocks.length; i++){
        
        blocks.push( new Block(
        html_blocks[i],
        starting_positions.splice( Math.floor(Math.random() * starting_positions.length), 1 )[0],
        i
        ) );
    }

    blocks.forEach( block => {
        block.repr.style.height = (block.val * 100/num_elem) + "%";
        block.moveTo(block.pos);
    });

}

function initValues() {
    root.style.setProperty("--transition-time", (delay/1000 * anim_time) + "s");
    blocks_container.style.width = (scaled_width * num_elem) + "px";
}

function initSliders() {
    anim_slider.value = anim_time * 100;
    delay_slider.value = delay;
    num_slider.value = num_elem;

    delay_slider.oninput = function() {
        delay = this.value;
        root.style.setProperty("--transition-time", (delay/1000 * anim_time) + "s");
    };

    anim_slider.oninput = function() {
        anim_time = this.value / 200;
        root.style.setProperty("--transition-time", (delay/1000 * anim_time) + "s");
    };

    num_slider.oninput = function() {
        blocks.forEach(block => { block.repr.remove(); });
        num_elem = this.value;
        
        stop_flag = true;
        setTimeout( () => { 
            stop_flag = false;
            setUnsorted(...blocks);
            dehighlight(...blocks);
            setUnmarked(...blocks); 
            sorting_flag = false;
        }, delay);

        initBlocks();
        initValues();
    };

    width_slider.oninput = function() {
        width_coeff = this.value / 100;

        scaled_width = COLUMNS_WIDTH * width_coeff;
        blocks_container.style.width = (scaled_width * num_elem) + "px";
    
        blocks.forEach(block => { 
            root.style.setProperty("--column-width", scaled_width + "px");
            block.moveTo(block.pos);
        });
    };
}


function move (b, pos) {
    if (b.pos < pos) {
        for(let i=b.pos; i<pos; i++) {
            blocks[i] = blocks[i+1];
            blocks[i].moveTo(i);
        }
        blocks[pos] = b;
        blocks[pos].moveTo(pos);
    }
    else if (b.pos > pos) {
        for(let i=b.pos; i>pos; i--) {
            blocks[i] = blocks[i-1];
            blocks[i].moveTo(i);
        }
        blocks[pos] = b;
        blocks[pos].moveTo(pos);
    }
}

function test() {
    let blocks_copy = [...blocks];
    blocks_copy.forEach(block => {
        block.moveTo(block.val-1);
        blocks[block.pos] = block;
    });
}

function swap(b1, b2) { 
    let temp = b1.pos;
    blocks[b1.pos] = b2;
    b1.moveTo(b2.pos);
    blocks[b2.pos] = b1;
    b2.moveTo(temp);
}



async function bubble_sort() {

    if (sorting_flag) return; 
    else sorting_flag = true;

    let exchange = true;

    // * * * mio codice * * * 
    for(let j=num_elem-1; j>0; j--) {
        if (exchange) {

            exchange = false;   
            for(let i=0; i<j; i++) {

                if(stop_flag) return;
    
                highlight(blocks[i], blocks[i+1]);
    
                await new Promise(resolve => { setTimeout( resolve, delay*0.2); });
    
                if (blocks[i].val > blocks[i+1].val) {
                    swap(blocks[i], blocks[i+1]);
                    exchange = true;
                }
    
                await new Promise(resolve => { setTimeout( resolve, delay*0.6); });
    
                dehighlight(blocks[i], blocks[i+1]);
    
                await new Promise(resolve => { setTimeout( resolve, delay*0.2); });
            }
            setSorted(blocks[j]);

        } else { 
            setSorted(...blocks);
            break;
        }
        
    }
    setSorted(blocks[0]);

    // * * * codice ottimizzato * * * 
}

async function selection_sort() {

    if (sorting_flag) return; 
    else sorting_flag = true;

    let min = 0;
    for(let j=0; j<num_elem-1; j++) {
        for(let i=j; i<num_elem; i++) {

            if(stop_flag) return;

            highlight(blocks[i]);
            
            await new Promise(resolve => { setTimeout( resolve, delay*0.4); });
            
            if (blocks[i].val <= blocks[min].val) {
                setUnmarked(blocks[min]);
                min = i;
                setMarked(blocks[min]);
            } else { dehighlight(blocks[i]); }

            
        }

        setUnmarked(blocks[min]);
        setSorted(blocks[min]);
        move(blocks[min], j);
        min = j+1;

        await new Promise(resolve => { setTimeout( resolve, delay*0.6); });
    }
    setSorted(blocks[num_elem-1]);

    sorting_flag = false;
}

async function insertion_sort() {

    if (sorting_flag) return; 
    else sorting_flag = true;

    setSorted(blocks[0]);
    for(let j=1; j<num_elem; j++) {

        setMarked(blocks[j]);

        for(let i=0; i<j; i++) {

            if(stop_flag) return;

            highlight(blocks[i]);
            
            await new Promise(resolve => { setTimeout( resolve, delay*0.4); });
            
            setSorted(blocks[i]);
         
            if (blocks[i].val > blocks[j].val) {
                // setUnmarked(blocks[j]);
                move(blocks[j], i);
                setSorted(blocks[i]);
                break;
            }

            if (i===j-1) {
                // setUnmarked(blocks[j]);
                setSorted(blocks[j]);
            }
        }

        await new Promise(resolve => { setTimeout( resolve, delay*0.6); });
    }

    sorting_flag = false;
}

async function quick_sort(i,j) {

    if (i===0 && j===num_elem && sorting_flag) return; 
    else sorting_flag = true;

    let i_0 = i;
    let j_0 = j;

    highlight(blocks[i]);
    setMarked(blocks[j]);

    let dir = 0;

    while(i<j) {

        if(stop_flag) return;
        
        switch(dir) {

            case 0:
                if(blocks[i].val < blocks[j].val) {
                    dehighlight(blocks[i]);
                    i++;
                    highlight(blocks[i]);
                } else {
                    swap(blocks[i], blocks[j]);
                    dir = 1;
                }
                break;

            case 1:
                if(blocks[i].val < blocks[j].val) {
                    dehighlight(blocks[j]);
                    j--;
                    highlight(blocks[j]);
                } else {
                    swap(blocks[i], blocks[j]);
                    dir = 0;
                }
                break;

        }

        await new Promise(resolve => { setTimeout( resolve, delay*0.4); });
        
    }

    dehighlight(blocks[i]);
    setUnmarked(blocks[i]);
    setSorted(blocks[i]);

    if (i!= j_0){
    console.log(i+1, j_0);
    await quick_sort(i+1, j_0);
    }

    if (i!=i_0) {
    console.log(i_0, i-1)
    await quick_sort(i_0, i-1);
    }

    if (i===0 && j===num_elem && sorting_flag) sorting_flag = false;
}

async function merge_sort(i,j) {

    if (i === j) return;
    
    let q = Math.floor((i + j) / 2);
    
    await merge_sort(i, q);
    await merge_sort(q+1, j);

    if (stop_flag) return;
    else await new Promise (resolve => setTimeout(resolve, delay * 0.5));
    if (stop_flag) return;

    let color;
    if (i===0 && (j===num_elem-1)) {
        color = SORTED_COLOR;
    } else {
        color = getRandomColor();
    }

    for(let index = i; index<=j; index++) {
        blocks[index].repr.style.backgroundColor = color;
        blocks[index].repr.style.opacity = 0.5; 
    }

    q++;
    while (i<q) {
        if (blocks[i].val <= blocks[q].val) {
            blocks[i].repr.style.opacity = 1;
            i++;
        } else {
            move(blocks[q], i);
            blocks[i].repr.style.opacity = 1;
            if(q<j) q++;
        }
        await new Promise (resolve => setTimeout(resolve, delay * 0.5));
    }

    for (let z=i; z<=j; z++) 
        blocks[z].repr.style.opacity = 1;
    

}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


function shuffle() {

    stop_flag = true;

    let newBlocks = [];
    let positions = [];
    for (let i=0; i<num_elem; i++) positions[i] = i;

    let index;
    for (let i=0; i<num_elem; i++) {
        index = positions.splice( Math.floor(Math.random() * positions.length), 1);
        blocks[i].moveTo(index);
        newBlocks[index] = blocks[i];
    }
    blocks = newBlocks;

    setTimeout( () => { 
        stop_flag = false;
        setUnsorted(...blocks);
        dehighlight(...blocks);
        setUnmarked(...blocks);
        sorting_flag = false; 
    }, delay*1.1);
}


function setSorted(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("marked");
        // b.repr.classList.remove("selected");
        // b.repr.classList.add("sorted");
        b.repr.style.backgroundColor = SORTED_COLOR;
    });
}
function setUnsorted(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("sorted");
        b.repr.style.backgroundColor = NEUTRAL_COLOR;
        b.repr.style.opacity = 1;
    });
}

function setMarked(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("selected");
        // b.repr.classList.remove("sorted");
        // b.repr.classList.add("marked");
        b.repr.style.backgroundColor = MARKED_COLOR;
    });
}
function setUnmarked(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("marked");
        b.repr.style.backgroundColor = NEUTRAL_COLOR;
    });
}


function highlight(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("marked");
        // b.repr.classList.remove("sorted");
        // b.repr.classList.add("selected");
        b.repr.style.backgroundColor = SELECTED_COLOR;
    });
} 
function dehighlight(...bs) {
    bs.forEach( b => {
        // b.repr.classList.remove("selected");
        b.repr.style.backgroundColor = NEUTRAL_COLOR;
    });
}

function start_algorithm() {    // function that the button triggers, start different algorithms based on the value of the select

    switch (algo_select.value) {
        case "- select algorithm -":
            break;
        case "Selection sort": selection_sort();
            break;
        case "Bubble sort": bubble_sort();
            break;
        case "Insertion sort": insertion_sort();
            break;
        case "Quick sort": quick_sort(0, num_elem-1);
            break;
        case "Merge sort": merge_sort(0, num_elem-1);
            break;
    }
}




const blocks_container = document.getElementById("blocks-container");
const root = document.querySelector(":root");
const anim_slider = document.getElementById("anim-time-slider");
const delay_slider = document.getElementById("delay-slider");
const num_slider = document.getElementById("num-items-slider");
const width_slider = document.getElementById("width-slider");
const algo_select = document.getElementById("algorithm-select");

var COLUMNS_WIDTH = parseInt( getComputedStyle(root).getPropertyValue('--column-width') );
var NEUTRAL_COLOR = getComputedStyle(root).getPropertyValue('--neutral-color');
var SORTED_COLOR = getComputedStyle(root).getPropertyValue('--sorted-color');
var MARKED_COLOR = getComputedStyle(root).getPropertyValue('--marked-color');
var SELECTED_COLOR = getComputedStyle(root).getPropertyValue('--selected-color');
var width_coeff = 1;
var scaled_width = COLUMNS_WIDTH * width_coeff;

var num_elem = 15;
var delay = 1000*parseFloat( getComputedStyle(root).getPropertyValue('--transition-time') );
var anim_time = 1;

var stop_flag = false;
var sorting_flag = false;

initBlocks();
initValues();
initSliders();
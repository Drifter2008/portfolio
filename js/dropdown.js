// object.method(arguments);
// console = developer tools console
// .log method = send a mesaage to the console
console.log('JAVASCRIPT IS RUNNING!!!!!!!!')



let menu = document.querySelector('#menu');
menu.classList.add('hidden');
menu.setAttribute('aria-hidden', 'true');
menu.setAttribute('aria-labelledby', 'menu-toggle');


let menu_toggle = document.createElement('button');
menu_toggle.classList.add('button');
menu_toggle.innerText = "Drawer Menu";
menu_toggle.setAttribute('id', 'menu-toggle');
menu_toggle.setAttribute('aria-label', 'Navigation');
menu_toggle.setAttribute('aria-controls', 'menu');
menu_toggle.setAttribute('aria-expanded', 'false');



let header_element = document.querySelector("header");
header_element.insertBefore(menu_toggle, menu);


menu_toggle.addEventListener('click',
    function() {
        console.log('menu_toggle has been clicked');
    
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            menu.setAttribute('aria-hidden', 'false');
            menu_toggle.setAttribute('aria-expanded', 'true');
        } else {
            menu.classList.add('hidden');
            menu.setAttribute('aria-hidden', 'true');
            menu_toggle.setAttribute('aria-expanded', 'false');
        }
    }
)
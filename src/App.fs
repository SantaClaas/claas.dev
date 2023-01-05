module App

open Browser.Dom
open Browser.Types
open Browser.CssExtensions
open Fable.Core.JS

type Point = { x: double; y: double }

[<Measure>]
type Degree
[<Measure>]
type Radian 

let toRadian (degree: float<Degree>) = degree * Math.PI / 180.
let toDegree (radians: float<Radian>) = radians * (180./Math.PI)
let private drawLine { x = x1; y = y1 } { x = x2; y = y2 } stroke (svg: HTMLElement) =
    let line =
        document.createElementNS ("http://www.w3.org/2000/svg", "line") :?> SVGLineElement

    line.setAttribute ("x1", x1.ToString())
    line.setAttribute ("y1", y1.ToString())
    line.setAttribute ("x2", x2.ToString())
    line.setAttribute ("y2", y2.ToString())
    line.setAttribute ("stroke-width", string stroke)
    line.classList.add "path"
    
    svg.appendChild line |> ignore
    let length = line.getTotalLength ()

    line.style.setProperty ("--path-length", string length)
    line.setAttribute ("stroke", "black")

let private drawLineAngle { x = x; y = y } (radiansAngle: float) length svg =
    // Length is hypotenuse thingy, unknown is opposite from angle
    let deltaY = radiansAngle |> sin |> (*) length
    // Get x (length² = y² + x²)
    // y² = length² - x²
    let deltaX = (length ** 2) - (deltaY ** 2) |> sqrt

    let newX = x + deltaX
    let newY = y + deltaY

    drawLine { x = x; y = y } { x = newX; y = newY } 20 svg
    drawLine { x = x; y = y } { x = newX; y = y } 4 svg
    drawLine { x = x; y = y } { x = x; y = newY } 4 svg

    

let svg = document.querySelector "svg" :?> HTMLElement

svg
|> drawLineAngle { x = 412.899; y = 414 } ((360. - 335.27) * Math.PI / 180.) 128.8846


svg |> drawLineAngle { x = 471; y = 440 } (335. * Math.PI / 180.) 129

svg |> drawLineAngle { x = 412; y = 483 } (55. * Math.PI / 180.) 185

svg |> drawLineAngle { x = 398; y = 586 } (112. * Math.PI / 180.) 181

svg |> drawLineAngle { x =455; y = 646 } (15. * Math.PI / 180.) 136



// // Mutable variable to count the number of times we clicked the button
// let mutable count = 0


// // Get a reference to our button and cast the Element to an HTMLButtonElement
// let myButton = document.querySelector(".my-button") :?> Browser.Types.HTMLButtonElement

// // Register our listener
// myButton.onclick <- fun _ ->
//     count <- count + 1
//     myButton.innerText <- sprintf "You clicked: %i time(s)" count

module App

open System
open Browser.Dom
open Browser.Svg
open Browser.SvgExtensions
open Browser.CssExtensions
open Browser.Types
open Fable.Core
open Fable.Core.JS
open Fable.Core.JsInterop

type Vector = { x: float; y: float }

module private Units =
    [<Measure>]
    type Degree

    [<Measure>]
    type Radian

    let toRadian (degree: float<Degree>) : float<Radian> = degree * Math.PI / 180.<Degree/Radian>
    // The <Degree/Radian> tells the compiler somehow that it converts it to degree
    let toDegree radians =
        radians * (180.<Degree/Radian> / System.Math.PI)

open Units

type private SVGLineElement with

    [<Emit("$0.getTotalLength($1...)")>]
    member this.getTotalLength() : float = jsNative

let private drawLine x1 y1 x2 y2 stroke (svg: HTMLElement) =
    let line =
        document.createElementNS ("http://www.w3.org/2000/svg", "line") :?> SVGLineElement

    line.setAttribute ("x1", x1 |> string)
    line.setAttribute ("y1", y1 |> string)
    line.setAttribute ("x2", x2 |> string)
    line.setAttribute ("y2", y2 |> string)
    line.setAttribute ("stroke-width", string stroke)
    line.setAttribute ("stroke", "black")

    svg.appendChild line |> ignore
    line

let svg = document.querySelector "svg" :?> HTMLElement

let svgRectangle = svg.getBoundingClientRect ()
let viewBox = (svg :?> SVGFitToViewBox).viewBox.baseVal

type Line =
    { x1: float
      y1: float
      x2: float
      y2: float
      reference: SVGLineElement }

type State = { editingLine: Line option }
let mutable currentState = { editingLine = None }

let updateLine (newLine: Line option) =
    currentState <- { currentState with editingLine = newLine }

let getCoordinatesInSvg (event: MouseEvent) =
    let factor = 10000.
    let offsetX = event.offsetX * factor
    let offsetY = event.offsetY * factor
    
    let right = svgRectangle.right * factor
    let bottom = svgRectangle.bottom * factor

    let width = viewBox.width * factor
    let height = viewBox.height * factor

    let ratioX = offsetX / right * factor
    // Calculate coordinates in SVG with ratio and viewbox width
    let x = width * ratioX
    console.log(x / factor / factor)
    let ratioY = offsetY / bottom
    let y = height * ratioY
    (x / factor  / factor, y / factor)

let handleMouseDown (event: MouseEvent) =
    console.log ("Down")
    // If no line is currently editing
    // Start new line
    let line = drawLine event.offsetX event.offsetY event.offsetX event.offsetY 20 svg

    let x, y = getCoordinatesInSvg event

    currentState <-
        { currentState with
            editingLine =
                Some
                    { x1 = x
                      y1 = y
                      x2 = x
                      y2 = y
                      reference = line } }



let handleMouseUp (event: MouseEvent) =
    console.log ("Up")

    match currentState with
    // If line is active update with new cords
    | { editingLine = Some line } ->
        // Get coordinates relative to svg

        let x, y = getCoordinatesInSvg event
        // Set last coordinates
        line.reference.setAttribute ("x2", x |> string)
        line.reference.setAttribute ("y2", y |> string)
        // Stop editing line
        currentState <- { currentState with editingLine = None }
    | _ -> ()



let handleMouseMove (event: MouseEvent) =
    match currentState with
    // If line is active update with new cords
    | { editingLine = Some line } ->
        // Set new coordinates in state
        let x, y = getCoordinatesInSvg event
        currentState <- { currentState with editingLine = Some { line with x2 = x; y2 = y } }

        // Set line coords on SVG
        line.reference.setAttribute ("x2", x |> string)
        line.reference.setAttribute ("y2", y |> string)
        ()
    | _ -> ()

svg.onpointerdown <- handleMouseDown
svg.onpointerup <- handleMouseUp
svg.onpointermove <- handleMouseMove

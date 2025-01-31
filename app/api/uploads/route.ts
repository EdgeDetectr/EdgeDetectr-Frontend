import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { spawn } from "child_process"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const operator = formData.get("operator") as string

    if (!file || !operator) {
      return NextResponse.json(
        { error: "File and operator are required" },
        { status: 400 }
      )
    }

    // Create uploads and results directories if they don't exist
    const uploadFolder = path.join(process.cwd(), "uploads")
    const resultsFolder = path.join(process.cwd(), "results")
    await mkdir(uploadFolder, { recursive: true })
    await mkdir(resultsFolder, { recursive: true })

    // Save uploaded image
    const inputFilename = `${Date.now()}-${file.name}`
    const outputFilename = `output-${inputFilename}`
    const inputPath = path.join(uploadFolder, inputFilename)
    const outputPath = path.join(resultsFolder, outputFilename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(inputPath, buffer)

    // Get executable path
    const executablePath = process.env.OPERATOR_PROCESS || path.join(process.cwd(), "../operators/build")
    const operatorProcess = path.join(executablePath, "operators")

    console.log("Processing image with operator:", operator)
    console.log("Input file:", inputPath)
    console.log("Output file:", outputPath)
    console.log("Executable path:", executablePath)
    console.log("Operator process:", operatorProcess)

    if (!fs.existsSync(operatorProcess)) {
      throw new Error("Operator executable not found")
    }

    return new Promise((resolve, reject) => {
      const cppProcess = spawn(operatorProcess, [
        encodeURIComponent(operator),
        inputPath,
        outputPath,
      ])

      cppProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`)
      })

      cppProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`)
      })

      cppProcess.on("close", (code) => {
        console.log("C++ process closed with code:", code)

        if (code !== 0) {
          reject(new Error(`Processing failed with code ${code}`))
          return
        }

        // Clean up files after 1 minute
        setTimeout(() => {
          try {
            fs.unlinkSync(inputPath)
            fs.unlinkSync(outputPath)
          } catch (cleanupErr) {
            console.error("Error cleaning up files:", cleanupErr)
          }
        }, 60000)

        resolve(NextResponse.json({
          inputImage: inputFilename,
          outputImage: outputFilename,
        }))
      })

      cppProcess.on("error", (err) => {
        console.error("C++ process error:", err)
        reject(err)
      })
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    )
  }
} 
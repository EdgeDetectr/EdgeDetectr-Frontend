import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const operator = formData.get("operator") as string

    if (!image || !operator) {
      return NextResponse.json(
        { error: "Image and operator are required" },
        { status: 400 }
      )
    }

    // Save uploaded image
    const buffer = Buffer.from(await image.arrayBuffer())
    const filename = `${Date.now()}-${image.name}`
    const uploadPath = path.join(process.cwd(), "uploads", filename)
    console.log(uploadPath)
    await writeFile(uploadPath, buffer)

    // Execute the C++ operator
    const backendPath = path.join(process.cwd(), "..", "backend")
    const command = `${backendPath}/operator ${operator} ${uploadPath}`
    
    await execAsync(command)

    // The result should be in the results folder
    const resultFilename = `processed-${filename}`

    return NextResponse.json({ filename: resultFilename })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    )
  }
} 
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_OUTPUT = 'public/assets_compressed/landingpagewoman.mp4'
const DEFAULT_POSTER = 'public/assets_compressed/landingpagewoman-poster.webp'
const DEFAULT_WIDTH = '1920'
const DEFAULT_POSTER_WIDTH = '1280'
const DEFAULT_CRF = '18'
const DEFAULT_POSTER_TIME = '00:00:01'

function readOption(name, fallback) {
  const prefix = `${name}=`
  const option = process.argv.find((argument) => argument.startsWith(prefix))
  return option ? option.slice(prefix.length) : fallback
}

function readSourcePath() {
  const sourcePath = process.argv.slice(2).find((argument) => !argument.startsWith('--'))

  if (!sourcePath) {
    throw new Error('Usage: npm run video:landing -- "C:\\path\\input.mp4"')
  }

  return path.resolve(sourcePath)
}

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })

    child.on('error', (error) => reject(error))
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

async function inspectVideo(label, filePath) {
  console.log(`\n${label}`)
  await runCommand('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=codec_name,profile,level,codec_tag_string,width,height,pix_fmt,duration,nb_frames',
    '-of',
    'default=noprint_wrappers=1',
    filePath,
  ])
}

async function main() {
  const sourcePath = readSourcePath()
  const outputPath = resolveProjectPath(readOption('--out', DEFAULT_OUTPUT))
  const posterPath = resolveProjectPath(readOption('--poster', DEFAULT_POSTER))
  const width = readOption('--width', DEFAULT_WIDTH)
  const posterWidth = readOption('--poster-width', DEFAULT_POSTER_WIDTH)
  const crf = readOption('--crf', DEFAULT_CRF)
  const posterTime = readOption('--poster-time', DEFAULT_POSTER_TIME)

  if (!existsSync(sourcePath)) {
    throw new Error(`Input video does not exist: ${sourcePath}`)
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await inspectVideo('Input video:', sourcePath)

  console.log('\nEncoding browser-compatible MP4...')
  await runCommand('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    sourcePath,
    '-an',
    '-vf',
    `scale=${width}:-2:flags=lanczos,fps=30`,
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-level:v',
    '4.1',
    '-preset',
    'slow',
    '-crf',
    crf,
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-g',
    '60',
    '-keyint_min',
    '60',
    '-sc_threshold',
    '0',
    '-tag:v',
    'avc1',
    outputPath,
  ])

  console.log('Generating poster frame...')
  await runCommand('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    posterTime,
    '-i',
    outputPath,
    '-frames:v',
    '1',
    '-vf',
    `scale=${posterWidth}:-1`,
    '-q:v',
    '70',
    posterPath,
  ])

  await inspectVideo('Output video:', outputPath)
  console.log(`\nWrote video: ${outputPath}`)
  console.log(`Wrote poster: ${posterPath}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

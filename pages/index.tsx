import { WatchList } from "./watch"
import { getStorage, ref, uploadBytes } from "firebase/storage"

export default function HomaPage() {
  async function handleAddVideo() {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "video/*"
    fileInput.onchange = async () => {
      if (!fileInput.files) {
        return
      }

      const [file] = fileInput.files
      if (!file) {
        return
      }

      const id = Math.random().toString(36).slice(2)
      const fileName = `movies/${id}.mp4`
      const watchList: WatchList = {
        time: 0,
        playing: false,
        url: fileName,
        updatedAt: Date.now(),
      }


      /// TODO: Add the video to the database

      const videoFileRef = ref(getStorage(), fileName)
      await uploadBytes(videoFileRef, file)

      fileInput.click()
    }

    return <>
      <button onClick={handleAddVideo}>Upload</button>
    </>
  }
}

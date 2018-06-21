export type SongInfo = {
    full: boolean
    metadataType: string
    url: string
    title?: string
    duration: number
    artist?: string[]
    album?: string
    albumartist?: string[]
    disk?: {
      no: number
      of: number
    }
    track?: {
        no: number
        of: number
    }
    year?: number
    genre?: string[]
    img?: Buffer
    imgURL?: string
    imgFormat?: string
};

import { v4 as uuidv4 } from 'uuid'

export function getUUID():string {
    // this function makes sure that the first letter of the UUID is a small letter for PNML specification
    return String.fromCharCode(97+Math.floor(Math.random() * 26))+uuidv4()
}
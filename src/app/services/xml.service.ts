import { Injectable } from '@angular/core'
import { Global } from './../globals'
import { getUUID } from './helper.service'

@Injectable({
    providedIn: 'root',
})
export class XMLService {
    /**
     * Initializes a new XML document with the core PNML structure and saves it as a global variable.
     */
    public createNewXMLDocument() {
        console.log('Local storage empty. Starting from scratch...')
        Global.xmlDoc = document.implementation.createDocument(null, 'pnml')

        const pnml = Global.xmlDoc.getElementsByTagName('pnml')[0]
        pnml.setAttribute('xmlns', 'http://www.pnml.org/version-2009/grammar/pnml')
        const net = pnml.appendChild(Global.xmlDoc.createElement('net'))
        net.setAttribute('id', getUUID())
        net.setAttribute('type', 'http://www.pnml.org/version-2009/grammar/highlevelnet')
        const name = net.appendChild(Global.xmlDoc.createElement('name'))
        const text = name.appendChild(Global.xmlDoc.createElement('text'))
        text.textContent = 'Example Net for Data Model Extraction'
        const page = net.appendChild(Global.xmlDoc.createElement('page'))
        page.setAttribute('id', getUUID())
    }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventResponse } from '../interfaces';
import { Subscription } from 'rxjs';
import { EventsService } from '../events.service';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { Network } from '@ngx-pwa/offline';
import { SwUpdate, UpdateAvailableEvent, UpdateActivatedEvent } from '@angular/service-worker';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  events: EventResponse[] = [];
  subscriptions: Subscription[] = [];
  online$ = this.network.onlineChanges;
  constructor(
     private eventService: EventsService,
     private nav: NavController,
     private network: Network,
     private updater: SwUpdate,
     private toastController: ToastController,
     private alertController: AlertController) {

  }
  ngOnInit(): void {
    this.subscriptions.push(this.eventService.getAll().subscribe(e => this.events.push(e)));
    this.initUpdater();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getEvents(): EventResponse[] {
    return this.events.sort((a, b) => a.event.created > b.event.created ? -1 : 1);
  }

  initUpdater() {
    this.subscriptions.push(this.updater.available.subscribe((e) => this.onUpdateAvailable(e)));
    this.subscriptions.push(this.updater.activated.subscribe((e) => this.onUpdateActivated(e)));
  }
  async onUpdateAvailable(event: UpdateAvailableEvent) {
    const updateMessage = event.available.appData['updateMessage'];
    const alert = await this.alertController.create({
      header: 'Update Available!',
      message: 'A new version of the applciation is avaiable. ' +
        `(Details: ${updateMessage}) ` +
        'Click OK to update now.',
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel',
          cssClass: 'secondary',
          handler: async () => {
            this.showToastMessage('Upadate deferred');
          }
        },
        {
          text: 'OK',
          handler: async () => {
            await this.updater.activateUpdate();
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }
  async onUpdateActivated(e: UpdateActivatedEvent) {
    await this.showToastMessage('Application updating.');
  }

  details(response: EventResponse) {
    this.nav.navigateForward(`/details/${response.event.id}`);
  }
  async showToastMessage(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      showCloseButton: true,
      position: 'top',
      closeButtonText: 'OK'
    });
    toast.present();
  }
}

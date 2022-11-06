import { Component, OnInit } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroupDirective, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import firebase from 'firebase/compat/app';
import { DatePipe } from '@angular/common';

import { AngularFireDatabase } from '@angular/fire/compat/database';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export const snapshotToArray = (snapshot: any) => {
  const returnArr = [];

  snapshot.forEach((childSnapshot: any) => {
      const item = childSnapshot.val();
      item.key = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
};

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss']
})
export class ChatroomComponent implements OnInit {

  @ViewChild('chatcontent') chatcontent: ElementRef;
  scrolltop: number = null;

  ref = this.afsData.database.ref('roomusers/');

  chatForm: FormGroup;
  nickname = '';
  roomname = '';
  message = '';
  users = [];
  chats = [];
  matcher = new MyErrorStateMatcher();

  constructor(private router: Router, public afsData: AngularFireDatabase,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public datepipe: DatePipe) {
      this.nickname = localStorage.getItem('nickname');
      this.roomname = this.route.snapshot.params['roomname'];
      this.afsData.database.ref('chats/').on('value', resp => {
        this.chats = [];
        this.chats = snapshotToArray(resp);
        setTimeout(() => this.scrolltop = this.chatcontent.nativeElement.scrollHeight, 500);
      });
      console.log(this.roomname)
    
      this.ref.orderByChild('roomname').equalTo(this.roomname).on('value', (resp2: any) => {
        const roomusers = snapshotToArray(resp2);
        this.users = roomusers.filter(x => x.status === 'online');
      });
    }

    ngOnInit(): void {
      this.chatForm = this.formBuilder.group({
        'message' : [null, Validators.required]
      });
    }

    onFormSubmit(form: any) {
      const chat = form;
      chat.roomname = this.roomname;
      chat.nickname = this.nickname;
      chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
      chat.type = 'message';
      const newMessage = this.afsData.database.ref('chats/').push();
      newMessage.set(chat);
      this.chatForm = this.formBuilder.group({
        'message' : [null, Validators.required]
      });
    }

    exitChat() {
      const chat = { roomname: '', nickname: '', message: '', date: '', type: '' };
      chat.roomname = this.roomname;
      chat.nickname = this.nickname;
      chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
      chat.message = `${this.nickname} leave the room`;
      chat.type = 'exit';
      const newMessage = this.afsData.database.ref('chats/').push();
      newMessage.set(chat);
  
      this.afsData.database.ref('roomusers/').orderByChild('roomname').equalTo(this.roomname).on('value', (resp: any) => {
        let roomuser = [];
        roomuser = snapshotToArray(resp);
        const user = roomuser.find(x => x.nickname === this.nickname);
        if (user !== undefined) {
          const userRef = this.afsData.database.ref('roomusers/' + user.key);
          userRef.update({status: 'offline'});
        }
      });
  
      this.router.navigateByUrl('/roomlist/' + this.nickname);
    }

}

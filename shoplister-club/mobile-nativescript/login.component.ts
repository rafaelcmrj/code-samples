import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterExtensions } from 'nativescript-angular/router';
import { LoadingIndicator } from "nativescript-loading-indicator";
import * as firebase from "nativescript-plugin-firebase";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { LayoutService } from '../shared/services/layout.service';

@Component({
    selector: 'ns-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    moduleId: module.id,
})
export class LoginComponent implements OnInit {

    public loginForm: FormGroup;

    private _loader: LoadingIndicator;

    constructor(private _routerExtensions: RouterExtensions, private _layoutService: LayoutService) {
        this._loader = new LoadingIndicator();
    }

    ngOnInit() {
        this.loginForm = new FormGroup({
            email: new FormControl('', [Validators.email, Validators.required]),
            password: new FormControl('', [Validators.required, Validators.minLength(6)])
        });

        this._layoutService.hideActionBar();
    }

    submit() {

        if (this.loginForm.valid) {
            this._loader.show();

            firebase.login({
                type: firebase.LoginType.PASSWORD,
                passwordOptions: this.loginForm.value
            }).then(result => {
                if (!result.emailVerified) {
                    dialogs.confirm({
                        title: 'Confirmação de e-mail',
                        message: 'Você ainda não confirmou seu e-mail, podemos re-enviar o e-mail confirmação caso deseje.',
                        cancelButtonText: 'Não, obrigado',
                        okButtonText: 'Sim, re-envie'
                    }).then(result => {
                        if (result) {
                            firebase.sendEmailVerification().then(() => {
                                dialogs.alert({
                                    title: 'Confirmação de e-mail',
                                    message: 'E-mail enviado com sucesso!',
                                    okButtonText: 'OK'
                                })
                            });
                        }
                    })
                }

                this._loader.hide();
            }).catch(error => {
                this._loader.hide();

                alert(error);
            });
        } else {
            alert('Preencha todos os dados corretamente');
        }
    }

    _createUser(user) {
        let username = user.additionalUserInfo.username;

        let socialNetworks = {};

        if (!username) {

            username = new Date().getTime(); // current timestamp for failure

            if (user.additionalUserInfo.providerId == 'google.com') {
                const email = user.additionalUserInfo.profile['email'].split('@');
                username = email[0];

                socialNetworks = {
                    google: username
                };
            } else if (user.additionalUserInfo.providerId == 'facebook.com') {
                username = user.additionalUserInfo.profile['id'];

                socialNetworks = {
                    facebook: username
                }
            }
        }

        firebase.update(`/users/${username}`, {
            name: user.additionalUserInfo.profile['name'],
            uid: user.uid,
            social_networks: socialNetworks
        });

        if (!user.emailVerified) {
            firebase.sendEmailVerification();
        }
    }

    _onLoginError(error) {
        dialogs.alert({
            title: 'Erro',
            message: 'Houve um erro ao tentar logar via Facebook, por favor tente novamente ou contate nosso suporte via hello@shoplister.club',
            okButtonText: 'OK'
        });
    }

    google() {
        firebase.login({
            type: firebase.LoginType.GOOGLE
        }).then(user => {
            this._createUser(user);
        }, error => {
            this._onLoginError(error);
        });
    }

    facebook() {
        firebase.login({
            type: firebase.LoginType.FACEBOOK
        }).then(user => {
            this._createUser(user);
        }, error => {
            this._onLoginError(error);
        });
    }

}

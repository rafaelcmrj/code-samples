import { Component, OnInit } from "@angular/core";
import { FormGroup, Validators, FormControl } from "@angular/forms";
import { RouterExtensions } from "nativescript-angular/router";
import { SuccessfulProvider } from "../shared/providers/successful.provider";

@Component({
    selector: "Signup",
    moduleId: module.id,
    templateUrl: "./signup.component.html",
    styleUrls: ["signup.component.scss"]
})

export class SignupComponent implements OnInit {
    signupFormStep1: FormGroup;
    signupFormStep2: FormGroup;
    step: number = 1;

    constructor(private routerExtensions: RouterExtensions, private successfulData: SuccessfulProvider) { }

    ngOnInit(): void {
        this.signupFormStep1 = new FormGroup({
            name: new FormControl("", [Validators.required, Validators.minLength(3)]),
            email: new FormControl("", [Validators.required, Validators.minLength(5), Validators.email])
        });
        this.signupFormStep2 = new FormGroup({
            mobile: new FormControl("", [Validators.required, Validators.minLength(10),
            Validators.maxLength(10), Validators.pattern("^[0-9]*$")]),
            password: new FormControl("", [Validators.required, Validators.minLength(6)])
        });
    }

    onRegisterSubmit() {
        this.successfulData.storage = { icon: "0xf046", title: "Account Registered", seconds: 5, url: "/login" };

        this.routerExtensions.navigate(["/successful", { clearHistory: true }], { clearHistory: true });
    }
}

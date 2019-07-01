import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { TNSFancyAlert } from "nativescript-fancyalert";
import { LoadingIndicator } from "nativescript-loading-indicator";
import statusBar = require("nativescript-status-bar");
import * as platform from "tns-core-modules/platform/platform";
import { Page, EventData } from "tns-core-modules/ui/page/page";
import { Audit, AuditsService, AuditSubmission, LayoutService } from "~/core";
import { QuestionControlService } from "~/core/services/question-control.service";
import { TextField } from "tns-core-modules/ui/text-field/text-field";

@Component({
	selector: "Audits",
	moduleId: module.id,
	templateUrl: "./audits.component.html",
	styleUrls: ["./audits.scss"]
})
export class AuditsComponent implements OnInit {
	private _loader: LoadingIndicator;
	private _auditSubmission: AuditSubmission;

	constructor(
		private _auditsService: AuditsService,
		private _route: ActivatedRoute,
		private _questionControlService: QuestionControlService,
		private _nsRouter: RouterExtensions,
		private _page: Page,
		private _layoutService: LayoutService
	) {
		this._loader = new LoadingIndicator();
	}

	public audit: Audit;
	public auditForm: FormGroup;
	public canGoBack: boolean;

	public ngOnInit() {
		this.canGoBack = this._nsRouter.canGoBack();
		this.hideStatusBar();
		this._layoutService.adjustAndroidScreenSize(this._page);

		this._route.params.subscribe(params => {
			this._auditsService.get(params.id).subscribe(
				result => {
					this.audit = result;

					this._auditSubmission = {
						auditId: this.audit.id,
						responses: []
					};

					this.auditForm = this._questionControlService.toFormGroup(
						this.audit.components
					);
				},
				error => {
					console.log(error);
				}
			);
		});
	}

	hideStatusBar() {
		if (platform.isIOS && this._layoutService.isiPhoneX()) {
			statusBar.hide();
			this._page.backgroundSpanUnderStatusBar = true;
			this._page.style.marginTop = this._layoutService.getiOSMarginTop();
			this._page.css = this._layoutService.getPageClass();
		}
	}

	public selectChoice(choice: string, question: any) {
		question.metadata.answer = choice;
		this.auditForm.controls[question.id].setValue(choice);
	}

	public onSubmitTap() {
		this.audit.components.forEach(component => {
			const value = this.auditForm.controls[component.id].value;
			const response =
				typeof value === "number" ? Math.round(value) : value;

			this.auditForm.controls[component.id].setValue(response);

			this._auditSubmission.responses.push({
				componentId: component.id,
				answer: response
			});
		});

		this._loader.show();

		this._auditsService.submit(this._auditSubmission).subscribe(
			result => {
				this._loader.hide();
				TNSFancyAlert.showSuccess(
					"Success!",
					"Your audit was sucessfully saved!"
				);

				this._nsRouter.navigate(["/dashboard"]);
			},
			error => {
				this._loader.hide();
				TNSFancyAlert.showError(
					"Error",
					"There was an error to process your request"
				);
			}
		);
	}

	public characterLimit(args: EventData, limit: number) {
		const textField = <TextField>args.object;
		textField.text = textField.text.substr(0, limit);
	}

	public goBack() {
		if (this._nsRouter.canGoBack()) {
			this._nsRouter.back();
		}
	}
}

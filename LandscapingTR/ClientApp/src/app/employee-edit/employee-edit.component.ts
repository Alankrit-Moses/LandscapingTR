import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { EmployeeTypes } from '../core/enums/employee-types.enum';
import { EmployeeModel } from '../core/models/company-resources/employee.model';
import { LandscapingTRLookupsModel } from '../core/models/landscaping-tr-lookups.model';
import { LookupItemModel } from '../core/models/lookups/lookup-item.model';
import { EmployeeService } from '../core/services/employee.service';
import { LookupService } from '../core/services/lookup.service';

@Component({
  selector: 'app-employee-edit',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.css']
})
export class EmployeeEditComponent {
  loaded!: boolean;
  // The employee Id as a number/string
  employeeId!: number;
  pathEmployeeId!: string;

  employeeToEditId!: number;
  pathEmployeeToEditId!: string;

  employeeModel!: EmployeeModel;

  // General properties
  employeeToEditModel!: EmployeeModel;
  employeeTypes!: LookupItemModel[];
  form: any = {
    id: null,
    username: null,
    firstName: null,
    lastName: null,
    password: null,
    employeeType: null,
  };

  constructor(private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private lookupService: LookupService,
    private router: Router,
    private toastr: ToastrService,) { }

  ngOnInit() {
    // Gets the employee Id
    const employeeIdFromUrl = this.route.snapshot.paramMap.get('id')?.slice(1);
    if (employeeIdFromUrl == null) {
      this.employeeId = -1;
    } else {
      this.employeeId = +employeeIdFromUrl;
    }

    this.pathEmployeeId = ":" + this.employeeId.toString();

    // Gets employee model
    this.employeeService.getEmployee(this.employeeId).subscribe({
      next: data => {

        this.employeeModel = data;
      },
      error: err => {
        console.log(err);
      }
    });


    // Gets the employee to edit Id
    const employeeToEditIdFromUrl = this.route.snapshot.paramMap.get('employeeToEditId')?.slice(1);
    if (employeeToEditIdFromUrl == null) {
      this.employeeToEditId = -1;
    } else {
      this.employeeToEditId = +employeeToEditIdFromUrl;
    }

    this.pathEmployeeToEditId = ":" + this.employeeToEditId.toString();


    forkJoin([
      this.employeeService.getEmployee(this.employeeToEditId),
      this.lookupService.getEmployeeTypes()
    ]).subscribe({
      next: data => {
        this.employeeToEditModel = data[0];

        this.form.id = this.employeeToEditModel.id;
        this.form.username = this.employeeToEditModel.username;
        this.form.firstName = this.employeeToEditModel.firstName;
        this.form.lastName = this.employeeToEditModel.lastName;
        this.form.password = this.employeeToEditModel.password;

        this.employeeTypes = data[1];

        var employeeType = this.employeeTypes.find(x => x.id === this.employeeToEditModel.employeeTypeId)?.lookupValue || "";
        this.form.employeeType = employeeType;


        this.loaded = true; // Set loaded to true once all observables complete
      },
      error: err => {
        console.log(err);
      }
    });
  }

  // Is for the header
  isExpanded = false;

  collapse() {
    this.isExpanded = false;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
  }

  // General methods

  getAdminType() {
    return EmployeeTypes.Administrator as number;
  }

  getSupervisorType() {
    return EmployeeTypes.CrewSupervisor as number;
  }

  onSubmit(): void {
    const { id, firstName, lastName, username, password, employeeType } = this.form;

    if (firstName == null || lastName == null || username == null || password == null || employeeType == null) {
      return;
    }

    if (firstName === '' || lastName === '' || username === '' || password === '' || employeeType === '') {
      return;
    }

    // code add employee method in service
    let newEmployeeModel = new EmployeeModel();

    newEmployeeModel.id = id;
    newEmployeeModel.username = username;
    newEmployeeModel.firstName = firstName;
    newEmployeeModel.lastName = lastName;
    newEmployeeModel.password = password;

    var employeeTypeId = this.employeeTypes.find(x => x.lookupValue === employeeType)?.id || 1;
    newEmployeeModel.employeeTypeId = employeeTypeId;



    this.employeeService.updateEmployee(newEmployeeModel).subscribe({
      next: data => {
        newEmployeeModel = data;
        this.form.id = newEmployeeModel.id;
        this.form.username = newEmployeeModel.username;
        this.form.firstName = newEmployeeModel.firstName;
        this.form.lastName = newEmployeeModel.lastName;
        this.form.password = newEmployeeModel.password;
        this.form.employeeTypeId = newEmployeeModel.employeeTypeId;
        this.toastr.success('Employee was saved successfully!', 'Saved Employee: ');
        this.router.navigate(["admin/:" + this.employeeModel.id])
      },
      error: err => {
        console.log(err);
      }
    });
  }

  onCancel(data: EmployeeModel): void {
    this.router.navigate(["admin/:" + data.id])
  }
}

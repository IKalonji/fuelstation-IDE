import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { WalletService } from '../services/wallet.service';
import { FuelStationService } from '../services/fuelstation.service';
import { Router } from '@angular/router';
import * as ace from "ace-builds";
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-fuelstation',
  templateUrl: './fuelstation.component.html',
  styleUrls: ['./fuelstation.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class FuelStationComponent implements OnInit, AfterViewInit {
  @ViewChild("editor") private editor: ElementRef<HTMLElement>;

  instructions:string = "Welcome to Fuel Station\nTo begin create a new workspace, which is a project that will contain the folders needed to begin developing on Fuel.";
  workspaces: TreeNode[][] = [];
  selectedFile: TreeNode = {};

  output: string = "Output displayed here!"

  setupDialogVisible = true;
  dialogMsg: string = "";

  createOrDeleteWorkspaceDialogVisible = false;
  createOrDeleteWorkspaceDialogHeader = "Manage Workspace";
  createOrDeleteWorkspaceDialogInput = "";
  createOrDeleteWorkspaceDialogLoading = false;

  fileManagement = false;
  filename = ""
  folder = {name:""}
  folders = [
    { name: 'contracts'},
    { name: 'scripts'},
    { name: ' transactions'},
    { name: 'tests'},
];
  currentManagementSelection = "";

  contractFunctions = false;
  contractFunctionSelection = "";
  account_name = "";
  network = {name:""}
  networks = [
    { name: 'emulator'},
    { name: 'testnet'},
    { name: ' mainnet'},
];

  createAccountLoading = false;
  createAccountDialogVisible = false;
  newAccountWorkspace = "";

  aceEditor: any;

  executionOutputDialog = false;
  executionLoading = true;
  executionOutput = "";

  argumentInput: argObject[] = [];
  getArguments = false;

  constructor(private walletService: WalletService, private fuelstationService: FuelStationService, private router: Router, private confirmationService: ConfirmationService, private toast: MessageService) {}

  ngOnInit(): void {
      this.dialogMsg = "Checking if user exists using the wallet used to sign in"
      if(!this.walletService.wallet){
        this.showToast(false)
        this.router.navigate(['/'])
      }
      this.fuelstationService.isUser(this.walletService.wallet).subscribe((user:any)=>{
        console.log("response from isuser", user);
        if(user.result == "OK"){
          this.dialogMsg = "User is valid. Getting your workspaces"
          this.fuelstationService.getWorkspaces(this.walletService.wallet).subscribe((workspace:any)=>{
            console.log(workspace);
            this.buildWorkspaceTreeObject(workspace.data)
            this.dialogMsg = "";
            this.setupDialogVisible = false;
            if(this.workspaces.length == 0) this.showInfoPopup("Get started", "You do not have any active workspaces, create a workspace to get started.")
          })
        }
        else { 
          this.dialogMsg = "User not found. Creating a user with wallet used to sign in"
          this.fuelstationService.createUser(this.walletService.wallet).subscribe((newUser: any)=>{
            console.log(newUser)
            this.dialogMsg = "User created";
            this.setupDialogVisible = false;
            this.showInfoPopup("Get started", "You do not have any active workspaces, create a workspace to get started.")
          })
        }
      });
  }

  ngAfterViewInit(): void {
    ace.config.set("fontSize", "14px");
    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.session.setValue(this.instructions);
  }
  
  nodeExpand(event:any){
    console.log("EXPAND Event: ", event);
    console.log(this.selectedFile);
    this.aceEditor.setValue(this.selectedFile.data);
  }
  
  nodeSelect(event:any){
    console.log("SELECT Event: ", event);
    console.log("SELECTED FILE: ", this.selectedFile);
    this.aceEditor.setValue(this.selectedFile.data);
  }

  workspace(){
    console.log("setup dialog for manage");
    this.createOrDeleteWorkspaceDialogVisible = true;
  }

  getWorkspace(){
    this.fuelstationService.getWorkspaces(this.walletService.wallet).subscribe((workspace:any)=>{
      console.log(workspace);
      if(workspace.result == "OK"){
        this.buildWorkspaceTreeObject(workspace.data)
      }
    })
  }

  createWorkspace(){
    this.createOrDeleteWorkspaceDialogLoading = true;
    console.log("executing create");
    this.showExecutionOutput()
          this.fuelstationService.createWorkspace(this.walletService.wallet, this.createOrDeleteWorkspaceDialogInput).subscribe(
            (data: any)=>{
              console.log(data.result);
              this.showToast(data.result == "OK")
              this.createOrDeleteWorkspaceDialogLoading = false;
              this.createOrDeleteWorkspaceDialogVisible = false;
              this.getWorkspace();
              this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
              this.executionLoading = false
              this.showInfoPopup("Accounts", "Default emulator account has been created and added to flow.json use that or create another for deployments. Create an account on testnet network by clicking the create account button if you plan on deploying to testnet.")
            }
          )
  }

  deleteWorkspace(){
    this.createOrDeleteWorkspaceDialogLoading = true;
    console.log("executing delete");
    this.showExecutionOutput()
          this.fuelstationService.deleteWorkspace(this.walletService.wallet, this.createOrDeleteWorkspaceDialogInput).subscribe(
            (data: any)=>{
              console.log(data.result);
              this.showToast(data.result == "OK")
              this.createOrDeleteWorkspaceDialogLoading = false;
              this.createOrDeleteWorkspaceDialogVisible = false;
              this.getWorkspace();
              this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
              this.executionLoading = false
            }
          )
  }

  addAccount(){
    console.log("Add account to flow.json");
    this.createAccountDialogVisible = true;
  }

  createAccount(){
    this.createAccountLoading = !this.createAccountLoading
    this.showExecutionOutput()
    this.fuelstationService.createAccount(this.walletService.wallet, this.newAccountWorkspace, this.account_name, this.network.name).subscribe(
      (data: any) => {
        this.showToast(data.result == "OK")
        this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"} -- Data:${data.data}`
        this.getWorkspace();
        this.createAccountLoading = false;
        this.createAccountDialogVisible = false;
        this.newAccountWorkspace = "";
        this.executionLoading = false,
        this.showInfoPopup("Faucet", "Follow the Fuel faucet link to fund your testnet account, ensure that you prefix with '0x' when using the faucet: https://testnet-faucet.onflow.org/")
      }
    )
  }

  logout(){
    console.log("Logout");
    this.showToast(true)
    this.walletService.disconnect()
    this.router.navigate([""]);
  }

  fileOptions(action: string){
    this.fileManagement = !this.fileManagement;
    this.currentManagementSelection = action;
  }

  saveFile(){
    console.log("Save file");
    let valueFromText = this.aceEditor.getValue()
    console.log(valueFromText);
    this.showExecutionOutput()
    this.fuelstationService.saveToFile(this.walletService.wallet, this.selectedFile.parent?.type, this.selectedFile.parent?.label?.toLowerCase(), this.selectedFile.label, valueFromText).subscribe(
      (data:any)=>{
        this.showToast(data.result == "OK")
        this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
        this.executionLoading = false
      }
    )
  }

  newFile(workspace:string | undefined){
    console.log("New File");  
    this.showExecutionOutput()  
    this.fuelstationService.createFile(this.walletService.wallet, workspace, this.folder.name, this.filename).subscribe(
      (data:any)=>{
        this.showToast(data.result == "OK")
        this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
        this.getWorkspace();
        this.fileManagement = false;
        this.executionLoading = false
        this.showInfoPopup("File Management", "Make sure to save file changes before switching files/folders or changes will be lost!")
      }
    )
  }

  deleteFile(workspace: string | undefined){
    console.log("Delete File");
    this.showExecutionOutput()
    this.fuelstationService.deleteFile(this.walletService.wallet, workspace, this.folder.name, this.filename).subscribe(
      (data:any)=>{
        this.showToast(data.result == "OK")
        this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
        this.getWorkspace();
        this.fileManagement = false;
        this.executionLoading = false
        this.showInfoPopup("Delete", "Deleted files cannot be recovered!")
      }
    )
  }

  contractOptions(action: string){
    this.contractFunctions = !this.contractFunctions;
    this.contractFunctionSelection = action;
  }

  deployContract(){
    console.log("Deploy Contract");
    this.showExecutionOutput()
    this.getArguments = false;
    let argsList:string[] = this.getContractScriptTransactionArguments()
    if(this.selectedFile.parent?.label == "Contracts" && this.selectedFile.label?.endsWith(".cdc")){
      this.fuelstationService.deployContract(this.walletService.wallet, this.selectedFile.parent.type, this.account_name, this.network.name, this.selectedFile.label, argsList).subscribe(
        (data:any)=>{
          this.showToast(data.result == "OK")
          this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
          this.resetContractFunctionVariables()
          this.executionLoading = false
        }
      )
    }
    else {
      this.executionOutput = `Result: ERROR -- Detail: SELECT A CONTRACT FILE BY CLICKING ON IT --Error: NO CONTRACT SELECTED`
      this.resetContractFunctionVariables()
      this.executionLoading = false
    }
  }

  getDeployArguments(){
    this.getArguments = true;
  }

  addArgument(){
    this.argumentInput.push({arg:""})
    console.log(this.argumentInput)
  }

  getContractScriptTransactionArguments(){
    let argsList:string[] = []
    this.argumentInput.forEach(element => {
      if (element.arg != "") argsList.push(element.arg);
    });
    console.log(argsList);
    return argsList;
  }

  runScript(){
    console.log("Run Script");
    this.showExecutionOutput()
    this.getArguments = false;
    let argsList:string[] = this.getContractScriptTransactionArguments()
    if(this.selectedFile.parent?.label == "Scripts" && this.selectedFile.label?.endsWith(".cdc")){
      this.fuelstationService.runScript(this.walletService.wallet, this.selectedFile.parent.type, this.network.name, this.selectedFile.label, argsList).subscribe(
        (data:any)=>{
          this.showToast(data.result == "OK")
          this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
          this.executionLoading = false
          this.resetContractFunctionVariables()
        }
      )
    }
    else{
      this.executionOutput = `Result: ERROR -- Detail: SELECT A SCRIPT FILE BY CLICKING ON IT --Error: NO SCRIPT SELECTED`
      this.executionLoading = false
      this.resetContractFunctionVariables()
    }
  }

  runTransaction(){
    console.log("Run Transaction");
    this.showExecutionOutput()
    this.getArguments = false;
    let argsList:string[] = this.getContractScriptTransactionArguments()
    if(this.selectedFile.parent?.label == "Transactions" && this.selectedFile.label?.endsWith(".cdc")){
      this.fuelstationService.runTransaction(this.walletService.wallet, this.selectedFile.parent.type, this.network.name, this.selectedFile.label, this.account_name, argsList).subscribe(
        (data:any)=>{
          this.showToast(data.result == "OK")
          this.executionOutput = `Result:${data.result} -- Detail:${data.detail} --Error:${data.error ? data.error : "None"}`
          this.executionLoading = false
          this.resetContractFunctionVariables()
        }
      )
    }
    else{
      this.executionOutput = `Result: ERROR -- Detail: SELECT A TRANSACTION FILE BY CLICKING ON IT --Error: NO TRANSACTION SELECTED`
      this.executionLoading = false;
      this.resetContractFunctionVariables()
    }
  }

  buildWorkspaceTreeObject(workspaceResponse: any[]){
    this.workspaces = []
    if(workspaceResponse.length == 0) return;
    workspaceResponse.forEach(_workspace => {
    const _contracts: any[] = _workspace.folders.contracts;
    const _scripts: any[] = _workspace.folders.scripts;
    const _transactions: any[] = _workspace.folders.transactions;
    const _tests: any[] = _workspace.folders.tests; 

    let contractsTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "Contracts",
      data: 'Contracts Folder',
      icon: 'pi pi-fw pi-folder-open',
      children: []
      }
    
    let scriptsTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "Scripts",
      data: 'Scripts Folder',
      icon: 'pi pi-fw pi-folder-open',
      children: []
      }
    let transactionsTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "Transactions",
      data: 'Transactions Folder',
      icon: 'pi pi-fw pi-folder-open',
      children: []
      }
    let testsTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "Tests",
      data: 'Tests Folder',
      icon: 'pi pi-fw pi-folder-open',
      children: []
      }
    let flowJSONTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "flow.json",
      data: `${_workspace['flow.json']}`,
      icon: 'pi pi-fw pi-file',
      }
    let readmeTreenode: TreeNode = {
      type: _workspace.workspace,
      label: "README.md",
      data: `${_workspace['README.md']}`,
      icon: 'pi pi-fw pi-file',
      }
    
    _contracts.forEach((_element: any) => {
      let newChild: TreeNode = {
        label: _element.name,
        data: `${_element.content}`,
        icon: 'pi pi-fw pi-file',
      }
      contractsTreenode.children?.push(newChild)
    });
    _scripts.forEach((_element: any) => {
      let newChild: TreeNode = {
        label: _element.name,
        data: `${_element.content}`,
        icon: 'pi pi-fw pi-file',
      }
      scriptsTreenode.children?.push(newChild)
    });
    _transactions.forEach((_element: any) => {
      let newChild: TreeNode = {
        label: _element.name,
        data: `${_element.content}`,
        icon: 'pi pi-fw pi-file',
      }
      transactionsTreenode.children?.push(newChild)
    });
    _tests.forEach((_element: any) => {
      let newChild: TreeNode = {
        label: _element.name,
        data: `${_element.content}`,
        icon: 'pi pi-fw pi-file',
      }
      testsTreenode.children?.push(newChild)
    });
    let _workspaceTreeNode:TreeNode[] = [contractsTreenode, scriptsTreenode, transactionsTreenode, testsTreenode, flowJSONTreenode, readmeTreenode]; 
    this.workspaces.push(_workspaceTreeNode);
    });
  }

  resetContractFunctionVariables(){
    this.contractFunctions = false;
    this.contractFunctionSelection = "";
    this.account_name = "";
    this.network = {name:""}
    this.argumentInput = [];
  }

  showExecutionOutput(){
    this.executionOutputDialog = true;
  }

  closeExecutionOutput(){
    this.executionOutputDialog = false;
    this.executionLoading = true;
    this.executionOutput = "";
  }

  showInfoPopup(header: string, message: string){
    this.confirmationService.confirm({
      message: message,
      header: header,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'OK',
      accept: () => {},
      rejectVisible: false
    });
  }

  showToast(success:boolean){
    let _severity = success ? 'success' : 'error';
    let _detail = success ? 'Successfully executed' : 'Error occured';
    this.toast.add({ severity: _severity, summary: 'Result', detail: _detail });
  }

}

export interface argObject {
  arg:string
}
